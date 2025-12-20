import { GoogleGenAI } from "@google/genai";

const getAiClient = () => {
  if (!process.env.API_KEY) {
    console.warn("API_KEY is missing from environment variables.");
    return null;
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const getFinancialAdvice = async (query: string): Promise<string> => {
  const ai = getAiClient();
  if (!ai) return "Sen đây! Hiện tại mình không thể kết nối được. Bạn kiểm tra lại khóa API giúp Sen nhé.";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: query,
      config: {
        systemInstruction: "Bạn là Sen (Sen ơi), một trợ lý tài chính ảo thông minh, thân thiện và chuyên nghiệp của nền tảng Finsensei. Hãy xưng hô là 'Sen' và gọi người dùng là 'bạn'. Phong cách trả lời: ân cần, sâu sắc nhưng dễ hiểu. Nhiệm vụ: phân tích cổ phiếu, thị trường tài chính Việt Nam. Sử dụng định dạng Markdown (**in đậm**, gạch đầu dòng) để trình bày đẹp mắt. Luôn dựa trên dữ liệu, cảnh báo rủi ro nếu cần thiết.",
      }
    });
    
    return response.text || "Sen chưa nghĩ ra câu trả lời ngay lúc này.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Sen đang gặp chút trục trặc kỹ thuật. Bạn thử lại sau nhé!";
  }
};