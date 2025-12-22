// Check MSN data on Supabase
const SUPABASE_URL = "https://trbiojajipzpqlnlghtt.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyYmlvamFqaXB6cHFsbmxnaHR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyMTg1NDEsImV4cCI6MjA4MTc5NDU0MX0.TOtVLQeFjes6NbnBTF6z-YPbFhSA-olvjJnAl60qhKQ";

async function checkData() {
  const symbol = 'MSN';
  const headers = { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` };
  
  console.log(`\n🔍 Checking data for ${symbol} on Supabase...\n`);
  
  try {
    // 1. SENAI Analysis
    const senaiRes = await fetch(`${SUPABASE_URL}/rest/v1/senai_analysis?symbol=eq.${symbol}&order=analysis_date.desc&limit=1`, { headers });
    const senai = (await senaiRes.json())[0];
    console.log('📊 SENAI Analysis:', senai ? `Rating=${senai.rating}, Score=${senai.score}, Signal=${senai.signal}` : '❌ KHÔNG CÓ');
    
    // 2. Trading Strategy
    const stratRes = await fetch(`${SUPABASE_URL}/rest/v1/trading_strategy?symbol=eq.${symbol}&order=analysis_date.desc&limit=1`, { headers });
    const strat = (await stratRes.json())[0];
    if (strat) {
      console.log('🎯 Trading Strategy:');
      console.log(`   Buy Zone: ${strat.buy_zone_low?.toLocaleString()} - ${strat.buy_zone_high?.toLocaleString()}`);
      console.log(`   Stop Loss: ${strat.stop_loss?.toLocaleString()} (${strat.stop_loss_percent}%)`);
      console.log(`   Target 1: ${strat.target_1?.toLocaleString()} (R:R ${strat.target_1_rr})`);
      console.log(`   Target 2: ${strat.target_2?.toLocaleString()} (R:R ${strat.target_2_rr})`);
      console.log(`   Risk Profile: ${strat.risk_profile}`);
    } else {
      console.log('🎯 Trading Strategy: ❌ KHÔNG CÓ');
    }
    
    // 3. Simplize (Beta)
    const simpRes = await fetch(`${SUPABASE_URL}/rest/v1/simplize_company_data?symbol=eq.${symbol}&limit=1`, { headers });
    const simp = (await simpRes.json())[0];
    console.log('📈 Simplize Beta:', simp?.beta_5y ? `✅ ${simp.beta_5y}` : '❌ KHÔNG CÓ');
    
    // 4. Technical Indicators
    const techRes = await fetch(`${SUPABASE_URL}/rest/v1/technical_indicators?symbol=eq.${symbol}&order=calculation_date.desc&limit=1`, { headers });
    const tech = (await techRes.json())[0];
    console.log('📉 Technical:', tech ? `RSI=${tech.rsi_14?.toFixed(1)}, Vol=${tech.volatility_20d?.toFixed(1)}%` : '❌ KHÔNG CÓ');
    
    // 5. Stock Prices
    const priceRes = await fetch(`${SUPABASE_URL}/rest/v1/stock_prices?symbol=eq.${symbol}&order=trading_date.desc&limit=1`, { headers });
    const price = (await priceRes.json())[0];
    console.log('💰 Price:', price ? `${price.close_price?.toLocaleString()} (${price.trading_date})` : '❌ KHÔNG CÓ');
    
    // 6. Risk Analysis
    const riskRes = await fetch(`${SUPABASE_URL}/rest/v1/risk_analysis?symbol=eq.${symbol}&order=analysis_date.desc&limit=1`, { headers });
    const risk = (await riskRes.json())[0];
    if (risk) {
      console.log('📊 Risk Analysis:');
      console.log(`   Nắm giữ tối ưu: ${risk.optimal_holding_days} ngày`);
      console.log(`   Xác suất tăng: ${risk.upside_probability}%`);
      console.log(`   Rủi ro điều chỉnh: ${risk.downside_risk}%`);
    } else {
      console.log('📊 Risk Analysis: ❌ KHÔNG CÓ');
    }
    
    console.log('\n--- SUMMARY ---');
    console.log('SENAI:', senai ? '✅' : '❌');
    console.log('Trading Strategy:', strat ? '✅' : '❌');
    console.log('Beta (Simplize):', simp?.beta_5y ? '✅' : '❌');
    console.log('Technical:', tech ? '✅' : '❌');
    console.log('Prices:', price ? '✅' : '❌');
    console.log('Risk Analysis:', risk ? '✅' : '❌');
    
  } catch (err) {
    console.error('Error:', err.message);
  }
}

checkData();
