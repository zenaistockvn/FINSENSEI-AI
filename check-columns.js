// Check if trading_strategy table has new columns
const SUPABASE_URL = "https://trbiojajipzpqlnlghtt.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyYmlvamFqaXB6cHFsbmxnaHR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyMTg1NDEsImV4cCI6MjA4MTc5NDU0MX0.TOtVLQeFjes6NbnBTF6z-YPbFhSA-olvjJnAl60qhKQ";

async function checkColumns() {
  const headers = { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` };
  
  // Get one row to see all columns
  const res = await fetch(`${SUPABASE_URL}/rest/v1/trading_strategy?limit=1`, { headers });
  const data = await res.json();
  
  if (data.length > 0) {
    console.log('📋 Columns in trading_strategy table:');
    const cols = Object.keys(data[0]);
    cols.forEach(c => console.log(`  - ${c}: ${data[0][c]}`));
    
    // Check required new columns
    const required = ['stop_loss_percent', 'target_1_rr', 'target_2_rr', 'risk_profile', 'confidence'];
    console.log('\n🔍 Checking required new columns:');
    required.forEach(col => {
      const exists = cols.includes(col);
      console.log(`  ${exists ? '✅' : '❌'} ${col}`);
    });
  } else {
    console.log('No data in trading_strategy table');
  }
}

checkColumns();
