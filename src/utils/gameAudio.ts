// =====================================================================
// GAME AUDIO SYSTEM FOR ELEMENTARY CLASSROOM ACTIVITIES
// Synthesizes cheerful background music & interactive sound effects 
// using Web Audio API (100% reliable, zero latency, offline ready)
// =====================================================================

export type GameMusicTrack = 'cheerful' | 'fast' | 'carnival' | 'gentle';

export interface GameTrackInfo {
  id: GameMusicTrack;
  name: string;
  icon: string;
  tempo: number; // BPM
  description: string;
}

export const GAME_TRACKS: GameTrackInfo[] = [
  {
    id: 'cheerful',
    name: 'Rộn Rã Tuổi Thơ 🎵',
    icon: '🎵',
    tempo: 128,
    description: 'Giai điệu vui nhộn, hào hứng, phù hợp cho mọi trò chơi',
  },
  {
    id: 'fast',
    name: 'Đấu Trường Siêu Tốc ⚡',
    icon: '⚡',
    tempo: 144,
    description: 'Nhịp điệu dồn dập, kịch tính cho thử thách tính giờ',
  },
  {
    id: 'carnival',
    name: 'Vòng Quay Lễ Hội 🎡',
    icon: '🎡',
    tempo: 132,
    description: 'Âm hưởng rộn ràng, vui tươi cho vòng quay may mắn',
  },
  {
    id: 'gentle',
    name: 'Tập Trung Khám Phá 🌸',
    icon: '🌸',
    tempo: 104,
    description: 'Êm dịu, nhẹ nhàng cho trò chơi ghép đôi và suy luận',
  },
];

class GameAudioEngine {
  private ctx: AudioContext | null = null;
  private bgmGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private masterGain: GainNode | null = null;

  private isBgmPlaying: boolean = false;
  private currentTrack: GameMusicTrack = 'cheerful';
  private bgmVolume: number = 0.45; // 0 to 1
  private sfxVolume: number = 0.8; // 0 to 1
  private isBgmMuted: boolean = false;
  private isSfxMuted: boolean = false;

  private bgmTimer: any = null;
  private noteIndex: number = 0;
  private isInitialized: boolean = false;

  constructor() {
    // Lazy initialized on first user interaction
  }

  private initContext() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return;
    }

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(1.0, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.bgmGain = this.ctx.createGain();
      this.bgmGain.gain.setValueAtTime(this.isBgmMuted ? 0 : this.bgmVolume, this.ctx.currentTime);
      this.bgmGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(this.isSfxMuted ? 0 : this.sfxVolume, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      this.isInitialized = true;
    } catch (e) {
      console.warn('Web Audio API not supported on this browser', e);
    }
  }

  // -------------------------------------------------------------------
  // BGM CONTROLS
  // -------------------------------------------------------------------
  public startBGM(track?: GameMusicTrack) {
    this.initContext();
    if (track) {
      this.currentTrack = track;
    }
    if (this.isBgmPlaying) return;

    this.isBgmPlaying = true;
    this.noteIndex = 0;
    this.scheduleBgmLoop();
  }

  public stopBGM() {
    this.isBgmPlaying = false;
    if (this.bgmTimer) {
      clearTimeout(this.bgmTimer);
      this.bgmTimer = null;
    }
  }

  public toggleBGM(): boolean {
    if (this.isBgmPlaying) {
      this.stopBGM();
      return false;
    } else {
      this.startBGM();
      return true;
    }
  }

  public setTrack(track: GameMusicTrack) {
    this.currentTrack = track;
    if (this.isBgmPlaying) {
      this.stopBGM();
      this.startBGM(track);
    }
  }

  public getTrack(): GameMusicTrack {
    return this.currentTrack;
  }

  public getIsPlaying(): boolean {
    return this.isBgmPlaying;
  }

  public setBgmVolume(val: number) {
    this.bgmVolume = Math.max(0, Math.min(1, val));
    if (this.bgmGain && this.ctx) {
      const target = this.isBgmMuted ? 0 : this.bgmVolume;
      this.bgmGain.gain.setValueAtTime(target, this.ctx.currentTime);
    }
  }

  public getBgmVolume(): number {
    return this.bgmVolume;
  }

  public toggleBgmMute(): boolean {
    this.isBgmMuted = !this.isBgmMuted;
    if (this.bgmGain && this.ctx) {
      this.bgmGain.gain.setValueAtTime(this.isBgmMuted ? 0 : this.bgmVolume, this.ctx.currentTime);
    }
    return this.isBgmMuted;
  }

  public getIsBgmMuted(): boolean {
    return this.isBgmMuted;
  }

  public setSfxVolume(val: number) {
    this.sfxVolume = Math.max(0, Math.min(1, val));
    if (this.sfxGain && this.ctx) {
      const target = this.isSfxMuted ? 0 : this.sfxVolume;
      this.sfxGain.gain.setValueAtTime(target, this.ctx.currentTime);
    }
  }

  public getSfxVolume(): number {
    return this.sfxVolume;
  }

  public toggleSfxMute(): boolean {
    this.isSfxMuted = !this.isSfxMuted;
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setValueAtTime(this.isSfxMuted ? 0 : this.sfxVolume, this.ctx.currentTime);
    }
    return this.isSfxMuted;
  }

  public getIsSfxMuted(): boolean {
    return this.isSfxMuted;
  }

  // -------------------------------------------------------------------
  // BGM SYNTHESIS SCHEDULER
  // Creates lively, multi-timbral playful classroom music patterns
  // -------------------------------------------------------------------
  private scheduleBgmLoop() {
    if (!this.isBgmPlaying || !this.ctx || !this.bgmGain) return;

    // Frequencies (Hz) for elementary joyful notes
    const NOTE_FREQS: Record<string, number> = {
      C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.00, A3: 220.00, B3: 246.94,
      C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00, B4: 493.88,
      C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.00,
      REST: 0,
    };

    // Melody definitions per track
    // Track 1: Cheerful Schoolyard (C major / A minor bouncy game tune)
    const cheerfulPattern = [
      { note: 'C4', bass: 'C3', len: 0.25 },
      { note: 'E4', bass: 'REST', len: 0.25 },
      { note: 'G4', bass: 'G3', len: 0.25 },
      { note: 'C5', bass: 'REST', len: 0.25 },
      { note: 'B4', bass: 'G3', len: 0.25 },
      { note: 'G4', bass: 'REST', len: 0.25 },
      { note: 'A4', bass: 'A3', len: 0.5 },
      
      { note: 'F4', bass: 'F3', len: 0.25 },
      { note: 'A4', bass: 'REST', len: 0.25 },
      { note: 'C5', bass: 'C3', len: 0.25 },
      { note: 'A4', bass: 'REST', len: 0.25 },
      { note: 'G4', bass: 'C3', len: 0.5 },
      { note: 'E4', bass: 'G3', len: 0.5 },

      { note: 'D4', bass: 'G3', len: 0.25 },
      { note: 'F4', bass: 'REST', len: 0.25 },
      { note: 'A4', bass: 'G3', len: 0.25 },
      { note: 'B4', bass: 'REST', len: 0.25 },
      { note: 'C5', bass: 'C3', len: 0.5 },
      { note: 'G4', bass: 'E3', len: 0.5 },

      { note: 'A4', bass: 'F3', len: 0.25 },
      { note: 'B4', bass: 'G3', len: 0.25 },
      { note: 'C5', bass: 'A3', len: 0.25 },
      { note: 'D5', bass: 'B3', len: 0.25 },
      { note: 'C5', bass: 'C3', len: 0.5 },
      { note: 'REST', bass: 'REST', len: 0.5 },
    ];

    // Track 2: Fast Speed Quiz (Exciting syncopated beat)
    const fastPattern = [
      { note: 'E4', bass: 'E3', len: 0.2 },
      { note: 'E4', bass: 'REST', len: 0.2 },
      { note: 'G4', bass: 'E3', len: 0.2 },
      { note: 'A4', bass: 'A3', len: 0.2 },
      { note: 'B4', bass: 'REST', len: 0.2 },
      { note: 'D5', bass: 'D3', len: 0.2 },
      { note: 'B4', bass: 'REST', len: 0.2 },
      { note: 'G4', bass: 'G3', len: 0.2 },

      { note: 'A4', bass: 'A3', len: 0.2 },
      { note: 'A4', bass: 'REST', len: 0.2 },
      { note: 'C5', bass: 'A3', len: 0.2 },
      { note: 'B4', bass: 'G3', len: 0.2 },
      { note: 'G4', bass: 'E3', len: 0.4 },
      { note: 'E4', bass: 'E3', len: 0.4 },
    ];

    // Track 3: Carnival Wheel (Playful waltz bounce)
    const carnivalPattern = [
      { note: 'G4', bass: 'C3', len: 0.3 },
      { note: 'E4', bass: 'C4', len: 0.3 },
      { note: 'C4', bass: 'C4', len: 0.3 },
      { note: 'A4', bass: 'F3', len: 0.3 },
      { note: 'F4', bass: 'F4', len: 0.3 },
      { note: 'D4', bass: 'F4', len: 0.3 },
      { note: 'B4', bass: 'G3', len: 0.3 },
      { note: 'G4', bass: 'G4', len: 0.3 },
      { note: 'C5', bass: 'C3', len: 0.6 },
    ];

    // Track 4: Gentle focus (Soft bells)
    const gentlePattern = [
      { note: 'C4', bass: 'C3', len: 0.4 },
      { note: 'E4', bass: 'REST', len: 0.4 },
      { note: 'G4', bass: 'REST', len: 0.4 },
      { note: 'C5', bass: 'G3', len: 0.4 },
      { note: 'A4', bass: 'F3', len: 0.4 },
      { note: 'F4', bass: 'REST', len: 0.4 },
      { note: 'G4', bass: 'C3', len: 0.8 },
    ];

    let pattern = cheerfulPattern;
    let tempoMultiplier = 1;
    if (this.currentTrack === 'fast') {
      pattern = fastPattern;
      tempoMultiplier = 0.8;
    } else if (this.currentTrack === 'carnival') {
      pattern = carnivalPattern;
      tempoMultiplier = 0.9;
    } else if (this.currentTrack === 'gentle') {
      pattern = gentlePattern;
      tempoMultiplier = 1.1;
    }

    const item = pattern[this.noteIndex % pattern.length];
    const duration = item.len * tempoMultiplier;

    const now = this.ctx.currentTime;

    // Play Melody note (Marimba / Glockenspiel sound)
    if (item.note !== 'REST' && NOTE_FREQS[item.note]) {
      this.playSynthNote(NOTE_FREQS[item.note], now, duration * 0.85, 'triangle', 0.22);
      // Add subtle bell sparkle harmonic
      this.playSynthNote(NOTE_FREQS[item.note] * 2, now, duration * 0.4, 'sine', 0.08);
    }

    // Play Bass note (Soft Pizzicato bass)
    if (item.bass !== 'REST' && NOTE_FREQS[item.bass]) {
      this.playSynthNote(NOTE_FREQS[item.bass], now, duration * 0.9, 'sine', 0.28);
    }

    // Advance note index
    this.noteIndex++;

    // Schedule next beat
    this.bgmTimer = setTimeout(() => {
      this.scheduleBgmLoop();
    }, duration * 1000);
  }

  private playSynthNote(
    freq: number,
    startTime: number,
    duration: number,
    type: OscillatorType = 'triangle',
    peakVolume: number = 0.2
  ) {
    if (!this.ctx || !this.bgmGain) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, startTime);

      // Attack - Decay envelope for cheerful instrument
      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.exponentialRampToValueAtTime(peakVolume, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      osc.connect(gain);
      gain.connect(this.bgmGain);

      osc.start(startTime);
      osc.stop(startTime + duration + 0.05);
    } catch {
      // Ignore audio glitches safely
    }
  }

  // -------------------------------------------------------------------
  // INTERACTIVE SOUND EFFECTS (SFX)
  // -------------------------------------------------------------------

  // 1. Wheel spin tick - sounds like mechanical wheel spinning
  public playSpinTick(pitchMultiplier: number = 1) {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.isSfxMuted) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;

      osc.type = 'square';
      osc.frequency.setValueAtTime(480 * pitchMultiplier, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.03);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.04);
    } catch {}
  }

  // 2. Correct answer chime - sweet positive C-E-G-C5 arpeggio
  public playCorrect() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.isSfxMuted) return;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    const now = this.ctx.currentTime;

    notes.forEach((freq, idx) => {
      try {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        const start = now + idx * 0.07;
        const dur = 0.35;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.001, start);
        gain.gain.exponentialRampToValueAtTime(0.25, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);

        osc.connect(gain);
        gain.connect(this.sfxGain!);

        osc.start(start);
        osc.stop(start + dur + 0.05);
      } catch {}
    });
  }

  // 3. Wrong answer friendly buzzer - gentle "uh-oh / boing"
  public playWrong() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.isSfxMuted) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.exponentialRampToValueAtTime(160, now + 0.28);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.32);
    } catch {}
  }

  // 4. Winner Fanfare - triumphant brass chords for selected student or quiz finish
  public playWinnerFanfare() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.isSfxMuted) return;

    const chords = [
      { notes: [392, 523.25, 659.25], delay: 0, dur: 0.2 },      // G4, C5, E5
      { notes: [392, 523.25, 659.25], delay: 0.18, dur: 0.2 },   // G4, C5, E5
      { notes: [440, 587.33, 698.46], delay: 0.36, dur: 0.2 },   // A4, D5, F5
      { notes: [523.25, 659.25, 783.99, 1046.5], delay: 0.54, dur: 0.7 }, // C5, E5, G5, C6 (Grand final)
    ];

    const now = this.ctx.currentTime;

    chords.forEach((chord) => {
      chord.notes.forEach((freq) => {
        try {
          const osc = this.ctx!.createOscillator();
          const gain = this.ctx!.createGain();
          const start = now + chord.delay;

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, start);

          gain.gain.setValueAtTime(0.001, start);
          gain.gain.exponentialRampToValueAtTime(0.2, start + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, start + chord.dur);

          osc.connect(gain);
          gain.connect(this.sfxGain!);

          osc.start(start);
          osc.stop(start + chord.dur + 0.05);
        } catch {}
      });
    });

    // Also trigger cheering applause after fanfare starts
    setTimeout(() => {
      this.playApplause();
    }, 400);
  }

  // 5. Applause / Cheering - simulated classroom clapping
  public playApplause() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.isSfxMuted) return;

    try {
      // Create white noise buffer for applause
      const bufferSize = this.ctx.sampleRate * 1.5;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        // Clapping clicks & ambient cheers
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.7));
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      // Bandpass filter to make it sound like clapping
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1200, this.ctx.currentTime);
      filter.Q.setValueAtTime(1.5, this.ctx.currentTime);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.35, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.4);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      noise.start();
    } catch {}
  }

  // 6. Match Success - magical harp chord
  public playMatch() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.isSfxMuted) return;

    const notes = [440, 554.37, 659.25, 880, 1108.73]; // A major sparkle
    const now = this.ctx.currentTime;

    notes.forEach((freq, idx) => {
      try {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        const start = now + idx * 0.05;
        const dur = 0.4;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.001, start);
        gain.gain.exponentialRampToValueAtTime(0.2, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);

        osc.connect(gain);
        gain.connect(this.sfxGain!);

        osc.start(start);
        osc.stop(start + dur + 0.05);
      } catch {}
    });
  }

  // 7. Bubble / Button click
  public playClick() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.isSfxMuted) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.04);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.05);
    } catch {}
  }

  // 8. Countdown Tick-Tock
  public playCountdown(isUrgent: boolean = false) {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.isSfxMuted) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      const freq = isUrgent ? 880 : 550;
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.07);
    } catch {}
  }
}

// Export singleton audio engine
export const gameAudio = new GameAudioEngine();
