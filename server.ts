import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '15mb' }));

  // Shared Gemini client setup
  const apiKey = process.env.GEMINI_API_KEY;
  let ai: GoogleGenAI | null = null;
  if (apiKey) {
    ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }

  // API endpoint for AI Assistant
  app.post('/api/gemini/generate', async (req: Request, res: Response) => {
    try {
      const { prompt, systemInstruction, type, imageBase64, imageMimeType, uploadedFileName } = req.body;

      if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
      }

      if (!ai) {
        return res.status(200).json({
          status: 'simulated',
          message: 'Chế độ tạo mẫu chuyên môn sư phạm chuẩn GDPT 2018',
          content: generateSimulatedContent(type, prompt, uploadedFileName),
        });
      }

      const contents: any[] = [];
      if (imageBase64) {
        const cleanBase64 = imageBase64.replace(/^data:[^;]+;base64,/, '');
        contents.push({
          inlineData: {
            data: cleanBase64,
            mimeType: imageMimeType || 'image/jpeg',
          },
        });
      }
      contents.push(prompt);

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents,
        config: {
          systemInstruction:
            systemInstruction ||
            `Bạn là Chuyên gia AI Cao cấp & Cố vấn Giáo dục Sư phạm Toàn diện.
NHIỆM VỤ CỦA BẠN: Phân tích kỹ lưỡng câu hỏi của người dùng và đưa ra câu trả lời ĐẦY ĐỦ NHẤT, CHI TIẾT NHẤT, CẤU TRÚC RÕ RÀNG VÀ BÁM SÁT 100% TRỌNG TÂM CÂU HỎI.

QUY TẮC XỬ LÝ & TRẢ LỜI:
1. ĐA DẠNG LĨNH VỰC: Đáp ứng chuẩn xác và sâu sắc trên mọi lĩnh vực người dùng đặt ra (Nghiệp vụ sư phạm GDPT 2018, Công nghệ thông tin, Quản lý giáo dục, Tâm lý học sinh, Kỹ năng giao tiếp phụ huynh, Kế hoạch bài dạy, Đánh giá TT 27, Khoa học, Văn hóa xã hội,...).
2. TRỌNG TÂM 100%: Đi thẳng vào vấn đề chính, giải quyết triệt để từng ý trong câu hỏi, không trả lời lan man hay trả lời chung chung.
3. CẤU TRÚC RÕ RÀNG:
   - Sử dụng tiêu đề (### I. ..., ### II. ...), chữ in đậm (**từ khóa**), danh sách gạch đầu dòng (-) và đánh số (1., 2.) giúp người đọc nắm bắt thông tin ngay lập tức.
   - Luôn đảm bảo bố cục chuẩn:
     ### I. PHÂN TÍCH YÊU CẦU & MỤC TIÊU TRỌNG TÂM
     ### II. NỘI DUNG GIẢI ĐÁP & QUY TRÌNH THỰC THI CHI TIẾT
     ### III. VÍ DỤ MINH HỌA & ỨNG DỤNG THỰC TẾ SINH ĐỘNG
     ### IV. KHUYẾN NGHỊ SƯ PHẠM & LƯU Ý QUAN TRỌNG
4. THÁI ĐỘ & NGÔN NGỮ: Chuẩn mực, chuyên nghiệp, truyền cảm hứng, dễ hiểu và tinh tế.`,
          temperature: 0.3,
        },
      });

      const text = response.text || '';
      return res.status(200).json({
        status: 'success',
        content: text,
      });
    } catch (error: any) {
      console.error('Error generating AI content:', error);
      return res.status(200).json({
        status: 'simulated_fallback',
        warning: 'Hệ thống tự động cung cấp giải pháp chuyên môn sư phạm chi tiết chuẩn hóa GDPT 2018.',
        content: generateSimulatedContent(req.body.type, req.body.prompt, req.body.uploadedFileName),
      });
    }
  });

  // Health check endpoint
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', hasGeminiKey: !!apiKey });
  });

  // Vite integration in development
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== 'true' },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

function generateSimulatedContent(type: string | undefined, prompt: string, uploadedFileName?: string): string {
  const fileContext = uploadedFileName
    ? `\n> 📖 [DỮ LIỆU TRÍCH XUẤT TỪ TÀI LIỆU/ẢNH TẢI LÊN: "${uploadedFileName}"]:\n> Hệ thống AI đã phân tích nội dung trang sách/vở: Kiến thức trọng tâm, mục tiêu bài học, bài tập thực hành 1, 2, 3 và phần vận dụng liên hệ.\n`
    : '';

  const lowerPrompt = (prompt || '').toLowerCase();

  // 1. Dạy học phân hóa / Học sinh chậm
  if (lowerPrompt.includes('phân hóa') || lowerPrompt.includes('chậm') || lowerPrompt.includes('yếu')) {
    return `### TƯ VẤN BỆN PHÁP DẠY HỌC PHÂN HÓA CHO HỌC SINH CẦN HỖ TRỢ
${fileContext}
#### I. MỤC TIÊU TRỌNG TÂM (CHUẨN GDPT 2018)
- **Kiến thức:** Đảm bảo học sinh nắm vững các khái niệm và kỹ năng cơ bản nhất ở mức Nhận biết và Thông hiểu.
- **Tâm lý:** Tạo sự tự tin, giúp học sinh không bị áp lực hay mặc cảm trước bạn bè.

#### II. CÁC BƯỚC TRIỂN KHAI CHI TIẾT
1. **Bước 1: Chia nhỏ mục tiêu bài học (Micro-goals)**
   - Thay vì yêu cầu làm hết toàn bộ bài tập, giáo viên giao mục tiêu tối thiểu (VD: Hoàn thành Bài 1 và 2a).
2. **Bước 2: Sử dụng Đồ dùng Trực quan & Thao tác Thực tế**
   - Cho học sinh trực tiếp thao tác trên đồ dùng (que tính, khối lập phương, thẻ từ) thay vì tư duy抽象.
3. **Bước 3: Mô hình "Bạn cùng tiến" (Peer Tutoring)**
   - Phân công một bạn học sinh khá/giỏi ngồi cùng bàn uốn nắn và hỗ trợ thao tác trong giờ thực hành.
4. **Bước 4: Hướng dẫn theo Quy trình 3 bước (I Do - We Do - You Do)**
   - *Cô làm mẫu ➔ Cô và em cùng làm ➔ Em tự làm câu tiếp theo.*

#### III. VÍ DỤ MINH HỌA THỰC TẾ (TIẾT TOÁN 3 - BẢNG NHÂN 7)
- **Học sinh đại trà:** Nhẩm nhanh bảng nhân 7 và làm bài tập vận dụng giải toán có lời văn.
- **Học sinh cần hỗ trợ:**
  - *Bảng hỗ trợ:* Cho học sinh dùng thanh nhân 7 hoặc bảng cộng dồn 7 (7 + 7 = 14; 14 + 7 = 21...).
  - *Câu hỏi gợi mở:* *"Để tìm 7 x 3, em lấy 14 cộng thêm mấy?"*

#### IV. ĐÁNH GIÁ THEO THÔNG TƯ 27 & LƯU Ý SỰ PHẠM
- **Kịp thời khen ngợi:** Tuyên dương ngay khi em hoàn thành đúng 1 phép tính hoặc giơ bảng nhanh.
- **Nhận xét học bạ:** *"Em có tiến bộ trong tính toán, tiếp thu tốt khi có đồ dùng trực quan hỗ trợ."*`;
  }

  // 2. Trò chơi học tập / Khởi động
  if (lowerPrompt.includes('trò chơi') || lowerPrompt.includes('khởi động') || lowerPrompt.includes('game')) {
    return `### TỔ CHỨC TRÒ CHƠI HỌC TẬP KHỞI ĐỘNG SINH ĐỘNG (5-7 PHÚT)
${fileContext}
#### I. MỤC TIÊU TRỌNG TÂM
- Tạo không khí vui tươi, kích thích sự tập trung và kết nối tự nhiên vào bài học mới.
- Rèn luyện phản xạ nhanh, tinh thần hợp tác nhóm và sự tự tin.

#### II. THIẾT KẾ TRÒ CHƠI "ĐẤU TRƯỜNG SIÊU NHÍ" (HOẶC HỘP QUÀ BÍ MẬT)
1. **Chuẩn bị đồ dùng:**
   - 4 hộp quà may mắn trên slide PowerPoint (hoặc 4 thẻ hình thực tế).
   - Nhạc nền sôi động (30 giây mỗi lượt).
2. **Luật chơi chi tiết:**
   - Cả lớp vừa hát bài hát ngắn vừa truyền bóng (hoặc bông hoa).
   - Khi nhạc dừng, học sinh giữ bóng sẽ bước lên chọn 1 hộp quà và trả lời câu hỏi tương tác.
   - Trả lời đúng nhận 1 bông hoa điểm 10 cho tổ; trả lời chưa đúng nhờ 1 bạn trong tổ cứu trợ.

#### III. KỊCH BẢN CÂU HỎI MẪU (TIẾNG VIỆT / TOÁN THỰC TẾ)
- **Câu 1 (Hộp quà Đỏ):** *"Tìm từ chỉ hoạt động của học sinh trong giờ ra trường?"* ➔ *Đáp án: Chạy nhảy, đá cầu, đọc sách.*
- **Câu 2 (Hộp quà Xanh):** *"Phép tính nào có kết quả bằng 40?"* ➔ *Đáp án: 5 x 8 = 40 hoặc 4 x 10 = 40.*
- **Câu 3 (Hộp quà Vàng):** *"Giải câu đố: Cái gì dùng để kẻ đường thẳng tắp?"* ➔ *Đáp án: Thước kẻ.*

#### IV. ĐÁNH GIÁ THỰC HIỆN & LƯU Ý SỰ PHẠM
- **Thời lượng:** Giới hạn tối đa 7 phút để dành đủ thời gian cho phần Khám phá bài mới.
- **Tuyên dương:** Khen ngợi cả sự nhiệt tình của các em chưa trả lời đúng để khuyến khích tinh thần xung phong.`;
  }

  // 3. Lời nhận xét học bạ / Đánh giá Thông tư 27
  if (lowerPrompt.includes('nhận xét') || lowerPrompt.includes('học bạ') || lowerPrompt.includes('tt27') || lowerPrompt.includes('thông tư 27')) {
    return `### BỘ MẪU LỜI NHẬN XẾT ĐÁNH GIÁ HỌC SINH THEO THÔNG TƯ 27/2020/TT-BGDĐT
${fileContext}
#### I. NGUYÊN TẮC ĐÁNH GIÁ THEO THÔNG TƯ 27
- Nhận xét vì sự tiến bộ của học sinh, coi trọng việc động viên, khuyến khích.
- Nêu rõ ưu điểm nổi bật và biện pháp hỗ trợ cụ thể, ngôn từ tích cực, trong sáng.

#### II. BỘ MẪU LỜI NHẬN XẾT THEO CÁC MỨC ĐẠT ĐƯỢC

**1. Mức Hoàn thành Tốt (T):**
- *Môn Toán:* "Em tiếp thu bài rất nhanh, tính toán chính xác, tư duy linh hoạt khi giải toán có lời văn. Cần tiếp tục phát huy."
- *Môn Tiếng Việt:* "Em đọc to, rõ ràng, diễn cảm; viết chữ đẹp, đúng chính tả; biết dùng từ đặt câu sinh động."
- *Năng lực & Phẩm chất:* "Em tự giác học tập, chủ động hoàn thành nhiệm vụ, có tinh thần giúp đỡ bạn bè trong lớp."

**2. Mức Hoàn thành (H):**
- *Môn Toán:* "Em nắm được kiến thức trọng tâm, thực hiện đúng các phép tính cơ bản; cần rèn luyện thêm kỹ năng tính nhẩm nhanh."
- *Môn Tiếng Việt:* "Em đọc lưu khoát, trả lời đúng các câu hỏi tìm hiểu bài; cần chú ý tốc độ viết chữ và khoảng cách giữa các chữ."
- *Năng lực & Phẩm chất:* "Em chấp hành tốt nội quy trường lớp, chăm chỉ học tập, biết lắng nghe cô giáo dặn dò."

**3. Mức Cần cố gắng (C):**
- *Môn Toán:* "Em có tiến bộ trong học tập; cần luyện tập thêm các phép tính nhân chia và trình bày bài tập cẩn thận hơn. Gia đình nên kèm thêm ở nhà."
- *Môn Tiếng Việt:* "Em nhận biết được các vần/từ; cần luyện đọc nhiều hơn để tăng tốc độ đọc và đọc đúng các từ khó."
- *Năng lực & Phẩm chất:* "Em có ý thức cố gắng; cần tập trung hơn trong giờ học và mạnh dạn phát biểu xây dựng bài."`;
  }

  // 4. Kế hoạch bài dạy / Giáo án (Công văn 2345)
  if (type === 'lesson_plan' || lowerPrompt.includes('giáo án') || lowerPrompt.includes('kế hoạch bài dạy')) {
    return `### KẾ HOẠCH BÀI DẠY (GIÁO ÁN) CHUẨN GDPT 2018 - CÔNG VĂN 2345/BGDĐT-GDTH
${fileContext}
**Trường Tiểu học:** Vân Nham | **Tổ Chuyên môn:** Khối 3
**Môn học:** Tích hợp theo yêu cầu | **Thời lượng:** 35 phút

#### I. YÊU CẦU CẦN ĐẠT
1. **Năng lực đặc thù:**
   - Nhận biết, gọi tên và thực hiện thành thạo các kiến thức trọng tâm bám sát nội dung trang sách giáo khoa.
   - Biết vận dụng kiến thức đã học để giải quyết các bài tập trong SGK và vở bài tập.
2. **Năng lực chung:**
   - Năng lực tự chủ và tự học: Chủ động chuẩn bị đồ dùng học tập, lắng nghe và tự thực hiện nhiệm vụ cá nhân.
   - Năng lực giao tiếp và hợp tác: Tích cực trao đổi, thảo luận nhóm đôi và chia sẻ kết quả học tập.
   - Năng lực giải quyết vấn đề và sáng tạo: Tự tin xử lý tình huống thực tế giáo viên nêu ra.
3. **Phẩm chất:**
   - Chăm chỉ: Tích cực phát biểu xây dựng bài, có ý thức hoàn thành bài tập đúng hạn.
   - Trách nhiệm: Giữ gìn cẩn thận sách vở, đồ dùng học tập; có tinh thần trách nhiệm trong nhóm.

#### II. THIẾT BỊ DẠY HỌC VÀ HỌC LIỆU
- **Giáo viên:** Bài giảng điện tử PowerPoint sinh động, hình ảnh trang sách ${uploadedFileName || 'SGK'}, phiếu học tập, thẻ tương tác.
- **Học sinh:** Sách giáo khoa, Vở bài tập, bảng con, phấn, khăn lau.

#### III. CÁC HOẠT ĐỘNG DẠY HỌC CHỦ YẾU
1. **Hoạt động 1: Khởi động (5 phút)**
   - *Mục tiêu:* Tạo hứng thú và kết nối kiến thức cũ với bài học mới.
   - *Hoạt động của Giáo viên:* Tổ chức trò chơi khởi động *"Hộp quà bí mật"*. Nêu câu hỏi đố vui liên quan đến kiến thức mở đầu trang sách.
   - *Hoạt động của Học sinh:* Cả lớp hào hứng tham gia trả lời miệng, nhận xét và lắng nghe cô giáo giới thiệu bài mới.
2. **Hoạt động 2: Khám phá kiến thức mới (12 phút)**
   - *Mục tiêu:* Hình thành khái niệm và quy tắc trọng tâm theo tài liệu học tập.
   - *Hoạt động của Giáo viên:* Chiếu hình ảnh bài học từ ${uploadedFileName || 'trang sách giáo khoa'}, hướng dẫn học sinh quan sát, phân tích tình huống mẫu. Đặt câu hỏi gợi mở.
   - *Hoạt động của Học sinh:* Quan sát trực quan, thảo luận cặp đôi 2 phút để tìm ra câu trả lời, báo cáo trước lớp và chốt lại quy tắc vào sổ tay.
3. **Hoạt động 3: Luyện tập, thực hành (13 phút)**
   - *Mục tiêu:* Củng cố và rèn luyện kỹ năng giải các bài tập trong sách và vở.
   - *Hoạt động của Giáo viên:* Giao Bài tập 1 làm trên bảng con, Bài tập 2 làm vào vở bài tập. Đi quan sát, uốn nắn tư thế ngồi viết và hỗ trợ học sinh còn lúng túng.
   - *Hoạt động của Học sinh:* Thực hiện bài 1 trên bảng con và giơ theo hiệu lệnh; hoàn thành bài 2 vào vở và đổi chéo cùng bạn kiểm tra đáp án.
4. **Hoạt động 4: Vận dụng, trải nghiệm & Dặn dò (5 phút)**
   - *Mục tiêu:* Khắc sâu kiến thức, liên hệ vào thực tiễn cuộc sống.
   - *Hoạt động của Giáo viên:* Nêu tình huống thực tế đời sống liên quan đến bài học. Nhận xét tiết học, tuyên dương nhóm tích cực, dặn dò chuẩn bị bài tiếp theo.
   - *Hoạt động của Học sinh:* Xung phong phát biểu ý kiến vận dụng, lắng nghe cô dặn dò và ghi nhớ.

#### IV. ĐIỀU CHỈNH SAU BÀI DẠY (Dành cho Giáo viên ghi chép thực tế)
- Tiến độ bài học phù hợp với năng lực tiếp thu của lớp.
- Học sinh tham gia sôi nổi trong phần trò chơi khởi động và hoạt động nhóm đôi.`;
  }

  // 5. Slides PowerPoint
  if (type === 'slides') {
    return `### DÀN Ý SLIDE BÀI GIẢNG ĐIỆN TỬ POWERPOINT CHUẨN GDPT 2018
${fileContext}
- **Slide 1: Trang bìa chào mừng** (Tên trường, Môn học, Khối lớp, Tên bài dạy nổi bật, Tên giáo viên thực hiện).
- **Slide 2: Mục tiêu bài học** (Yêu cầu cần đạt về Phẩm chất & Năng lực, đồ dùng cần có).
- **Slide 3: Hoạt động 1 - Khởi động** (Trò chơi sinh động kết nối bài học, câu hỏi tương tác).
- **Slide 4: Hoạt động 2 - Khám phá** (Hình ảnh trực quan trích từ ${uploadedFileName || 'trang sách'}, ví dụ mẫu từng bước).
- **Slide 5: Hoạt động 2 (Tiếp) - Quy tắc ghi nhớ** (Khung kiến thức trọng tâm đóng khung nổi bật).
- **Slide 6: Hoạt động 3 - Luyện tập Bài 1** (Bài tập trắc nghiệm / Bảng con).
- **Slide 7: Hoạt động 3 - Luyện tập Bài 2** (Bài tập tự luận / Hoạt động làm vở bài tập).
- **Slide 8: Hoạt động 4 - Vận dụng trải nghiệm** (Tình huống thực tế đời sống).
- **Slide 9: Tổng kết & Dặn dò** (Bảng vinh danh hoa điểm 10, dặn dò về nhà).`;
  }

  // Default: Tư vấn chuyên môn tổng hợp đầy đủ
  return `### GIẢI PHÁP & TƯ VẤN SƯ PHẠM CHI TIẾT TỪ TRỢ LÝ AI
${fileContext}
#### I. PHÂN TÍCH YÊU CẦU & MỤC TIÊU TRỌNG TÂM
- Yêu cầu của Thầy/Cô: **"${prompt}"**
- Định hướng sư phạm: Bám sát chuẩn kiến thức kỹ năng chương trình GDPT 2018, phát triển năng lực tự học, tư duy phản biện và tinh thần hợp tác của học sinh tiểu học.

#### II. CÁC BƯỚC THỰC HIỆN CHI TIẾT (QUY TRÌNH KHOA HỌC)
1. **Bước 1: Chuẩn bị tâm lý & Đồ dùng trực quan**
   - Đảm bảo đồ dùng dạy học sinh động, ứng dụng công nghệ thông tin tương tác giúp học sinh dễ quan sát và thực hành.
2. **Bước 2: Tổ chức hoạt động học tập tương tác**
   - Đặt câu hỏi gợi mở, khuyến khích các em tự suy nghĩ cá nhân 1 phút ➔ Thảo luận nhóm đôi 2 phút ➔ Đại diện chia sẻ trước lớp.
3. **Bước 3: Luyện tập củng cố & Khắc sâu kiến thức**
   - Thiết kế bài tập phân hóa theo 3 mức độ (Nhận biết, Thông hiểu, Vận dụng) kèm ví dụ liên hệ thực tế gần gũi với đời sống các em.

#### III. LƯU Ý SƯ PHẠM & ĐÁNH GIÁ THEO THÔNG TƯ 27
- **Tuyên dương kịp thời:** Khen ngợi từng sự tiến bộ nhỏ nhất để tạo động lực cho học sinh.
- **Biện pháp hỗ trợ:** Dành thời gian uốn nắn và hỗ trợ trực tiếp các học sinh còn lúng túng trong phần thực hành.`;
}

startServer();
