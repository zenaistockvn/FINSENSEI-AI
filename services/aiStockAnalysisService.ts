/**
 * AI Stock Analysis Service
 * Sử dụng OpenAI GPT-4 Vision để phân tích chart và thông tin cơ bản
 * Kết quả được cache trên Supabase trong ngày
 */

const OPENAI_API_KEY = (import.meta as any).env?.VITE_OPENAI_API_KEY || '';
const OPENAI_MODEL = 'gpt-4o';

// Supabase config
const SUPABASE_URL = 'https://trbiojajipzpqlnlghtt.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyYmlvamFqaXB6cHFsbmxnaHR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyMTg1NDEsImV4cCI6MjA4MTc5NDU0MX0.TOtVLQeFjes6NbnBTF6z-YPbFhSA-olvjJnAl60qhKQ';

export interface StockFundamentals {
  symbol: string;
  companyName: string;
  industry: string;
  currentPrice: number;
  priceChange: number;
  priceChangePercent: number;
  volume: number;
  pe?: number;
  pb?: number;
  roe?: number;
  eps?: number;
  debtToEquity?: number;
  revenueGrowth?: number;
  profitGrowth?: number;
  ma20?: number;
  ma50?: number;
  rsi?: number;
  trendShort?: string;
  trendMedium?: string;
}

export interface AIStockAnalysisResult {
  symbol: string;
  analysisDate: string;
  overallSentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  confidenceScore: number;
  technicalAnalysis: {
    trend: string;
    support: string;
    resistance: string;
    pattern: string;
    signal: string;
  };
  fundamentalAnalysis: {
    valuation: string;
    growth: string;
    financial: string;
  };
  shortSummary: string;
  recommendation: 'MUA' | 'BÁN' | 'NẮM GIỮ' | 'THEO DÕI';
  strengths: string[];
  risks: string[];
  targetPrice?: {
    low: number;
    mid: number;
    high: number;
  };
  fromCache?: boolean;
}

const ANALYSIS_SYSTEM_PROMPT = `Bạn là chuyên gia phân tích chứng khoán Việt Nam. Phân tích cổ phiếu dựa trên dữ liệu PTKT và PTCB được cung cấp.

QUAN TRỌNG: Chỉ trả về JSON thuần túy, không có markdown, không có text khác.

Format JSON:
{
  "overallSentiment": "BULLISH",
  "confidenceScore": 75,
  "technicalAnalysis": {
    "trend": "Xu hướng tăng ngắn hạn, giá đang test vùng kháng cự",
    "support": "25,000 - 25,500",
    "resistance": "28,000 - 28,500",
    "pattern": "Đang hình thành mô hình tam giác tăng",
    "signal": "RSI trung tính, MACD cắt lên - Tích cực"
  },
  "fundamentalAnalysis": {
    "valuation": "P/E 12x thấp hơn trung bình ngành, định giá hấp dẫn",
    "growth": "Tăng trưởng doanh thu 15% YoY, lợi nhuận cải thiện",
    "financial": "ROE 18% tốt, D/E 0.5 an toàn"
  },
  "shortSummary": "Cổ phiếu đang trong xu hướng tích lũy với nền tảng cơ bản vững chắc. RSI trung tính cho thấy chưa quá mua/bán. Khuyến nghị theo dõi vùng breakout 28,000.",
  "recommendation": "THEO DÕI",
  "strengths": ["Định giá hấp dẫn so với ngành", "Tài chính lành mạnh", "Xu hướng kỹ thuật tích cực"],
  "risks": ["Thanh khoản thấp", "Phụ thuộc vào chu kỳ kinh tế"],
  "targetPrice": {"low": 24000, "mid": 27000, "high": 30000}
}

Lưu ý:
- overallSentiment: BULLISH (tích cực), BEARISH (tiêu cực), NEUTRAL (trung lập)
- recommendation: MUA, BÁN, NẮM GIỮ, THEO DÕI
- targetPrice là giá VND (số nguyên)
- Phân tích dựa trên cả PTKT (MA, RSI, xu hướng) và PTCB (P/E, P/B, ROE)`;

/**
 * Lấy ngày hôm nay theo format YYYY-MM-DD
 */
function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Kiểm tra cache trên Supabase
 */
async function getCachedAnalysis(symbol: string): Promise<AIStockAnalysisResult | null> {
  try {
    const today = getTodayDate();
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/ai_stock_insights?symbol=eq.${symbol}&analysis_date=eq.${today}&limit=1`,
      {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        },
      }
    );

    if (!response.ok) return null;

    const data = await response.json();
    if (data.length === 0) return null;

    const cached = data[0];
    return {
      symbol: cached.symbol,
      analysisDate: cached.analysis_date,
      overallSentiment: cached.overall_sentiment,
      confidenceScore: cached.confidence_score,
      technicalAnalysis: {
        trend: cached.tech_trend || '',
        support: cached.tech_support || '',
        resistance: cached.tech_resistance || '',
        pattern: cached.tech_pattern || '',
        signal: cached.tech_signal || '',
      },
      fundamentalAnalysis: {
        valuation: cached.fund_valuation || '',
        growth: cached.fund_growth || '',
        financial: cached.fund_financial || '',
      },
      shortSummary: cached.short_summary,
      recommendation: cached.recommendation,
      strengths: cached.strengths || [],
      risks: cached.risks || [],
      targetPrice: cached.target_low ? {
        low: cached.target_low,
        mid: cached.target_mid,
        high: cached.target_high,
      } : undefined,
      fromCache: true,
    };
  } catch (error) {
    console.error('Error getting cached analysis:', error);
    return null;
  }
}

/**
 * Lưu analysis vào Supabase
 */
async function saveAnalysisToCache(
  result: AIStockAnalysisResult,
  fundamentals: StockFundamentals
): Promise<void> {
  try {
    const today = getTodayDate();
    const payload = {
      symbol: result.symbol,
      analysis_date: today,
      overall_sentiment: result.overallSentiment,
      confidence_score: result.confidenceScore,
      recommendation: result.recommendation,
      tech_trend: result.technicalAnalysis.trend,
      tech_support: result.technicalAnalysis.support,
      tech_resistance: result.technicalAnalysis.resistance,
      tech_pattern: result.technicalAnalysis.pattern,
      tech_signal: result.technicalAnalysis.signal,
      fund_valuation: result.fundamentalAnalysis.valuation,
      fund_growth: result.fundamentalAnalysis.growth,
      fund_financial: result.fundamentalAnalysis.financial,
      short_summary: result.shortSummary,
      strengths: result.strengths,
      risks: result.risks,
      target_low: result.targetPrice?.low,
      target_mid: result.targetPrice?.mid,
      target_high: result.targetPrice?.high,
      input_price: fundamentals.currentPrice,
      input_pe: fundamentals.pe,
      input_pb: fundamentals.pb,
      input_roe: fundamentals.roe,
      input_rsi: fundamentals.rsi,
    };

    // Upsert (insert or update)
    await fetch(`${SUPABASE_URL}/rest/v1/ai_stock_insights`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates',
      },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error('Error saving analysis to cache:', error);
  }
}

/**
 * Phân tích cổ phiếu - kiểm tra cache trước, nếu không có thì gọi AI
 */
export async function analyzeStockWithChart(
  fundamentals: StockFundamentals,
  chartImageBase64?: string,
  forceRefresh: boolean = false
): Promise<AIStockAnalysisResult> {
  // Kiểm tra cache trước (trừ khi force refresh)
  if (!forceRefresh) {
    const cached = await getCachedAnalysis(fundamentals.symbol);
    if (cached) {
      console.log(`📦 Loaded ${fundamentals.symbol} analysis from cache`);
      return cached;
    }
  }

  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key chưa được cấu hình');
  }

  const userPrompt = buildAnalysisPrompt(fundamentals);
  
  const messages: any[] = [
    { role: 'system', content: ANALYSIS_SYSTEM_PROMPT },
  ];

  if (chartImageBase64) {
    messages.push({
      role: 'user',
      content: [
        {
          type: 'text',
          text: userPrompt + '\n\nPhân tích thêm biểu đồ nến đính kèm để nhận định xu hướng và mô hình giá.'
        },
        {
          type: 'image_url',
          image_url: {
            url: chartImageBase64.startsWith('data:') 
              ? chartImageBase64 
              : `data:image/png;base64,${chartImageBase64}`,
            detail: 'high'
          }
        }
      ]
    });
  } else {
    messages.push({ role: 'user', content: userPrompt });
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
        messages,
        temperature: 0.3,
        max_tokens: 1500,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'OpenAI API error');
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('Không nhận được phản hồi từ AI');
    }

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      // Try to extract JSON
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Invalid JSON response');
      }
    }

    const result: AIStockAnalysisResult = {
      symbol: fundamentals.symbol,
      analysisDate: new Date().toISOString(),
      overallSentiment: parsed.overallSentiment || 'NEUTRAL',
      confidenceScore: parsed.confidenceScore || 70,
      technicalAnalysis: parsed.technicalAnalysis || {
        trend: 'Chưa xác định',
        support: 'N/A',
        resistance: 'N/A',
        pattern: 'N/A',
        signal: 'Trung lập',
      },
      fundamentalAnalysis: parsed.fundamentalAnalysis || {
        valuation: 'Chưa đánh giá',
        growth: 'Chưa đánh giá',
        financial: 'Chưa đánh giá',
      },
      shortSummary: parsed.shortSummary || 'Chưa có nhận định',
      recommendation: parsed.recommendation || 'THEO DÕI',
      strengths: parsed.strengths || [],
      risks: parsed.risks || [],
      targetPrice: parsed.targetPrice,
      fromCache: false,
    };

    // Lưu vào cache
    await saveAnalysisToCache(result, fundamentals);
    console.log(`💾 Saved ${fundamentals.symbol} analysis to cache`);

    return result;
  } catch (error) {
    console.error('Error analyzing stock:', error);
    throw error;
  }
}

/**
 * Phân tích nhanh không cần chart
 */
export async function analyzeStockQuick(
  fundamentals: StockFundamentals,
  forceRefresh: boolean = false
): Promise<AIStockAnalysisResult> {
  return analyzeStockWithChart(fundamentals, undefined, forceRefresh);
}

/**
 * Build prompt từ dữ liệu PTKT và PTCB
 */
function buildAnalysisPrompt(data: StockFundamentals): string {
  const lines = [
    `📊 PHÂN TÍCH CỔ PHIẾU: ${data.symbol} - ${data.companyName}`,
    `Ngành: ${data.industry}`,
    '',
    '═══ THÔNG TIN GIÁ ═══',
    `• Giá hiện tại: ${data.currentPrice.toLocaleString()} VND`,
    `• Thay đổi: ${data.priceChange >= 0 ? '+' : ''}${data.priceChange.toLocaleString()} (${data.priceChangePercent >= 0 ? '+' : ''}${data.priceChangePercent.toFixed(2)}%)`,
    `• Khối lượng: ${(data.volume / 1000000).toFixed(2)} triệu CP`,
  ];

  lines.push('', '═══ CHỈ SỐ PTKT (Phân tích Kỹ thuật) ═══');
  if (data.ma20) lines.push(`• MA20: ${data.ma20.toLocaleString()} ${data.currentPrice > data.ma20 ? '(Giá > MA20 ✓)' : '(Giá < MA20 ✗)'}`);
  if (data.ma50) lines.push(`• MA50: ${data.ma50.toLocaleString()} ${data.currentPrice > data.ma50 ? '(Giá > MA50 ✓)' : '(Giá < MA50 ✗)'}`);
  if (data.rsi) {
    const rsiStatus = data.rsi > 70 ? '⚠️ Quá mua' : data.rsi < 30 ? '⚠️ Quá bán' : '✓ Trung tính';
    lines.push(`• RSI(14): ${data.rsi.toFixed(1)} - ${rsiStatus}`);
  }
  if (data.trendShort) lines.push(`• Xu hướng ngắn hạn: ${data.trendShort}`);
  if (data.trendMedium) lines.push(`• Xu hướng trung hạn: ${data.trendMedium}`);

  lines.push('', '═══ CHỈ SỐ PTCB (Phân tích Cơ bản) ═══');
  if (data.pe) lines.push(`• P/E: ${data.pe.toFixed(2)}`);
  if (data.pb) lines.push(`• P/B: ${data.pb.toFixed(2)}`);
  if (data.roe) lines.push(`• ROE: ${data.roe.toFixed(2)}%`);
  if (data.eps) lines.push(`• EPS: ${data.eps.toLocaleString()} VND`);
  if (data.debtToEquity) lines.push(`• D/E (Nợ/Vốn): ${data.debtToEquity.toFixed(2)}`);
  if (data.revenueGrowth) lines.push(`• Tăng trưởng Doanh thu: ${data.revenueGrowth.toFixed(1)}%`);
  if (data.profitGrowth) lines.push(`• Tăng trưởng Lợi nhuận: ${data.profitGrowth.toFixed(1)}%`);

  lines.push('', '═══ YÊU CẦU ═══');
  lines.push('Dựa trên dữ liệu PTKT và PTCB trên, hãy đưa ra nhận định tổng quan và khuyến nghị đầu tư.');

  return lines.join('\n');
}

/**
 * Capture chart as base64 image
 */
export async function captureChartAsBase64(chartElement: HTMLElement): Promise<string> {
  const html2canvas = (await import('html2canvas')).default;
  
  const canvas = await html2canvas(chartElement, {
    backgroundColor: '#0f172a',
    scale: 2,
    logging: false,
    useCORS: true,
  });
  
  return canvas.toDataURL('image/png');
}

export default {
  analyzeStockWithChart,
  analyzeStockQuick,
  captureChartAsBase64,
  getCachedAnalysis,
};
