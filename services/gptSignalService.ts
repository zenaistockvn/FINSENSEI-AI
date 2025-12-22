/**
 * GPT Signal Service - Phân tích tín hiệu AI bằng ChatGPT
 * Sử dụng GPT-4o-mini
 */

const OPENAI_API_KEY = (import.meta as any).env?.VITE_OPENAI_API_KEY || '';
const OPENAI_MODEL = 'gpt-4o-mini'; // GPT-4o-mini - nhanh và tiết kiệm

export interface AISignal {
  id: number;
  type: 'success' | 'warning' | 'danger' | 'info';
  title: string;
  message: string;
  timestamp: string;
  confidence?: number;
}

interface StockDataForAnalysis {
  symbol: string;
  currentPrice: number;
  priceChange: number;
  priceChangePercent: number;
  volume: number;
  high: number;
  low: number;
  open: number;
  ma20?: number;
  ma50?: number;
  rsi?: number;
  recentPrices: { date: string; close: number; volume: number }[];
}

const SIGNAL_PROMPT = `Bạn là chuyên gia phân tích kỹ thuật chứng khoán Việt Nam. Phân tích dữ liệu cổ phiếu và đưa ra 2-4 tín hiệu giao dịch quan trọng nhất.

Mỗi tín hiệu cần có:
- type: "success" (tín hiệu tích cực), "warning" (cảnh báo), "danger" (rủi ro cao), "info" (thông tin)
- title: Tiêu đề ngắn gọn (tối đa 20 ký tự)
- message: Mô tả chi tiết (tối đa 80 ký tự)
- confidence: Độ tin cậy 0.0-1.0

Trả về JSON array:
[
  {"type": "success", "title": "Tín hiệu Mua", "message": "Giá vượt MA20, RSI hồi phục từ vùng quá bán", "confidence": 0.8},
  ...
]

Chỉ trả về JSON array, không có text khác.`;

export async function analyzeStockWithGPT(data: StockDataForAnalysis): Promise<AISignal[]> {
  if (!OPENAI_API_KEY) {
    console.warn('OpenAI API key not configured, using fallback signals');
    return getFallbackSignals(data);
  }

  try {
    const userMessage = `
Phân tích cổ phiếu ${data.symbol}:
- Giá hiện tại: ${data.currentPrice.toLocaleString()} VND
- Thay đổi: ${data.priceChangePercent >= 0 ? '+' : ''}${data.priceChangePercent.toFixed(2)}%
- Khối lượng: ${(data.volume / 1000000).toFixed(2)}M
- Cao/Thấp phiên: ${data.high.toLocaleString()} / ${data.low.toLocaleString()}
- MA20: ${data.ma20 ? data.ma20.toLocaleString() : 'N/A'}
- MA50: ${data.ma50 ? data.ma50.toLocaleString() : 'N/A'}
- RSI(14): ${data.rsi ? Math.round(data.rsi) : 'N/A'}
- Giá 5 phiên gần nhất: ${data.recentPrices.slice(-5).map(p => p.close.toLocaleString()).join(' → ')}
`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [
          { role: 'system', content: SIGNAL_PROMPT },
          { role: 'user', content: userMessage },
        ],
        temperature: 0.4,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error('OpenAI API error');
    }

    const result = await response.json();
    const content = result.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No response from AI');
    }

    // Parse JSON array
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('Invalid AI response format');
    }

    const signals = JSON.parse(jsonMatch[0]) as AISignal[];
    
    // Add IDs and timestamps
    return signals.map((signal, index) => ({
      ...signal,
      id: index + 1,
      timestamp: getRelativeTime(index),
    }));

  } catch (error) {
    console.error('GPT Signal Analysis error:', error);
    return getFallbackSignals(data);
  }
}

function getRelativeTime(index: number): string {
  const times = ['Vừa xong', '5 phút trước', '15 phút trước', '30 phút trước', '1 giờ trước'];
  return times[index] || 'Hôm nay';
}

// Fallback signals khi không có API key hoặc lỗi
function getFallbackSignals(data: StockDataForAnalysis): AISignal[] {
  const signals: AISignal[] = [];
  
  // RSI signals
  if (data.rsi) {
    if (data.rsi > 70) {
      signals.push({
        id: 1,
        type: 'warning',
        title: 'Vùng Quá mua',
        message: `RSI đạt ${Math.round(data.rsi)}, cân nhắc chốt lời một phần.`,
        timestamp: 'Vừa xong',
        confidence: 0.75
      });
    } else if (data.rsi < 30) {
      signals.push({
        id: 2,
        type: 'info',
        title: 'Vùng Quá bán',
        message: `RSI về ${Math.round(data.rsi)}, cơ hội tích lũy tiềm năng.`,
        timestamp: 'Vừa xong',
        confidence: 0.7
      });
    }
  }

  // MA signals
  if (data.ma20 && data.currentPrice) {
    if (data.currentPrice > data.ma20 * 1.02) {
      signals.push({
        id: 3,
        type: 'success',
        title: 'Xu hướng Tăng',
        message: 'Giá đang trên MA20, xu hướng ngắn hạn tích cực.',
        timestamp: '10 phút trước',
        confidence: 0.8
      });
    } else if (data.currentPrice < data.ma20 * 0.98) {
      signals.push({
        id: 4,
        type: 'danger',
        title: 'Dưới MA20',
        message: 'Giá dưới MA20, cần thận trọng với vị thế mua.',
        timestamp: '15 phút trước',
        confidence: 0.75
      });
    }
  }

  // Volume signal
  if (data.volume > 3000000) {
    signals.push({
      id: 5,
      type: 'info',
      title: 'Thanh khoản cao',
      message: 'Khối lượng giao dịch vượt trung bình, dòng tiền quan tâm.',
      timestamp: '30 phút trước',
      confidence: 0.65
    });
  }

  // Price change signal
  if (Math.abs(data.priceChangePercent) > 3) {
    signals.push({
      id: 6,
      type: data.priceChangePercent > 0 ? 'success' : 'warning',
      title: data.priceChangePercent > 0 ? 'Tăng mạnh' : 'Giảm mạnh',
      message: `Biến động ${data.priceChangePercent > 0 ? '+' : ''}${data.priceChangePercent.toFixed(1)}% trong phiên.`,
      timestamp: 'Hôm nay',
      confidence: 0.7
    });
  }

  return signals.slice(0, 4); // Max 4 signals
}

export default { analyzeStockWithGPT };
