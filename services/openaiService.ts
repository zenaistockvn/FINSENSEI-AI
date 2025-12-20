// OpenAI Service for Natural Language Stock Filtering
const OPENAI_API_KEY = (import.meta as any).env?.VITE_OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY;
const OPENAI_MODEL = 'gpt-4o-mini'; // Using gpt-4o-mini as gpt-5-nano is not available yet

interface FilterConfig {
  rsMin: number;
  rsMax: number;
  rsiMin: number;
  rsiMax: number;
  trendShort: string;
  trendMedium: string;
  aboveMa20: boolean | null;
  aboveMa50: boolean | null;
  goldenCross: boolean;
  minScore: number;
  sectors?: string[];
}

interface AIFilterResponse {
  filters: FilterConfig;
  explanation: string;
  confidence: number;
}

const SYSTEM_PROMPT = `Bạn là AI chuyên gia phân tích chứng khoán Việt Nam. Nhiệm vụ của bạn là chuyển đổi câu hỏi/yêu cầu của người dùng thành bộ lọc cổ phiếu.

Các tham số lọc có thể sử dụng:
- rsMin, rsMax: RS Rating (0-100), đo lường sức mạnh tương đối của cổ phiếu
- rsiMin, rsiMax: RSI 14 ngày (0-100), <30 là quá bán, >70 là quá mua
- trendShort: Xu hướng ngắn hạn ("UP", "DOWN", "SIDEWAYS", "ALL")
- trendMedium: Xu hướng trung hạn ("UP", "DOWN", "SIDEWAYS", "ALL")
- aboveMa20: Giá trên MA20 (true/false/null)
- aboveMa50: Giá trên MA50 (true/false/null)
- goldenCross: Có tín hiệu Golden Cross (true/false)
- minScore: Điểm kỹ thuật tối thiểu (0-100)
- sectors: Mảng các ngành (ví dụ: ["Ngân hàng", "Bất động sản", "Công nghệ"])

Các ngành phổ biến: Ngân hàng, Bất động sản, Chứng khoán, Thép, Dầu khí, Công nghệ, Bán lẻ, Thực phẩm, Dược phẩm, Xây dựng, Vận tải, Điện, Hóa chất, Cao su, Thủy sản

Trả về JSON với format:
{
  "filters": { ... các tham số lọc ... },
  "explanation": "Giải thích ngắn gọn về bộ lọc",
  "confidence": 0.0-1.0 (độ tin cậy)
}

Ví dụ:
- "Cổ phiếu quá bán" -> rsiMax: 30
- "RS cao" -> rsMin: 70
- "Xu hướng tăng" -> trendShort: "UP", trendMedium: "UP"
- "Golden Cross" -> goldenCross: true
- "Ngân hàng mạnh" -> sectors: ["Ngân hàng"], rsMin: 60

Chỉ trả về JSON, không có text khác.`;

export async function parseNaturalLanguageFilter(userQuery: string): Promise<AIFilterResponse> {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userQuery },
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'OpenAI API error');
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No response from AI');
    }

    // Parse JSON response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid AI response format');
    }

    const parsed = JSON.parse(jsonMatch[0]) as AIFilterResponse;

    // Validate and set defaults
    const defaultFilters: FilterConfig = {
      rsMin: 0,
      rsMax: 100,
      rsiMin: 0,
      rsiMax: 100,
      trendShort: 'ALL',
      trendMedium: 'ALL',
      aboveMa20: null,
      aboveMa50: null,
      goldenCross: false,
      minScore: 0,
    };

    return {
      filters: { ...defaultFilters, ...parsed.filters },
      explanation: parsed.explanation || 'Đã áp dụng bộ lọc theo yêu cầu',
      confidence: parsed.confidence || 0.8,
    };
  } catch (error) {
    console.error('Error parsing natural language filter:', error);
    throw error;
  }
}

// Quick suggestions based on common queries
export const quickSuggestions = [
  { text: 'Cổ phiếu ngân hàng đang quá bán', icon: '🏦' },
  { text: 'Tìm CP có Golden Cross và RS > 70', icon: '✨' },
  { text: 'Bất động sản xu hướng tăng', icon: '🏠' },
  { text: 'Cổ phiếu momentum mạnh, volume cao', icon: '🚀' },
  { text: 'CP công nghệ điểm kỹ thuật cao', icon: '💻' },
  { text: 'Cổ phiếu đang tích lũy, RSI trung tính', icon: '📊' },
];

export default { parseNaturalLanguageFilter, quickSuggestions };
