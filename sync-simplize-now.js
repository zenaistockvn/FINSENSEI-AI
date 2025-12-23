/**
 * Sync Simplize Prices to Supabase
 * Run: node sync-simplize-now.js
 * Or: node sync-simplize-now.js HPG (single stock)
 */

const SUPABASE_URL = 'https://yvpvhwfpshuhxmqjlvbh.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2cHZod2Zwc2h1aHhtcWpsdmJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4MTg4ODQsImV4cCI6MjA2MzM5NDg4NH0.3oNDpfdOPy0U0FqmPbVr3JxBfPBwggJCAueBYtiB_7c';

const VN30 = ['ACB','BCM','BID','BVH','CTG','FPT','GAS','GVR','HDB','HPG','MBB','MSN','MWG','PLX','POW','SAB','SHB','SSB','SSI','STB','TCB','TPB','VCB','VHM','VIB','VIC','VJC','VNM','VPB','VRE'];

async function fetchSimplizePrice(symbol) {
    try {
        const res = await fetch(`https://api.simplize.vn/api/company/summary/${symbol.toLowerCase()}`);
        if (!res.ok) {
            console.log(`  ⚠️ API error for ${symbol}: ${res.status}`);
            return null;
        }
        
        const result = await res.json();
        const d = result.data;
        if (!d || !d.priceClose) {
            console.log(`  ⚠️ No price data for ${symbol}`);
            return null;
        }

        return {
            symbol: symbol.toUpperCase(),
            price: d.priceClose || 0,
            change: d.netChange || 0,
            changePercent: d.pctChange || 0,
            open: d.priceOpen || d.priceClose || 0,
            high: d.priceHigh || d.priceClose || 0,
            low: d.priceLow || d.priceClose || 0,
            volume: d.volume || 0,
            ceiling: d.priceCeiling || 0,
            floor: d.priceFloor || 0,
            reference: d.priceReferrance || d.priceClose || 0,
        };
    } catch (e) {
        console.log(`  ❌ Error fetching ${symbol}: ${e.message}`);
        return null;
    }
}

async function updateSupabase(priceData) {
    const today = new Date().toISOString().split('T')[0];
    
    const simplizePayload = {
        price_close: priceData.price,
        price_open: priceData.open,
        price_high: priceData.high,
        price_low: priceData.low,
        price_ceiling: priceData.ceiling,
        price_floor: priceData.floor,
        price_reference: priceData.reference,
        net_change: priceData.change,
        pct_change: priceData.changePercent,
        volume: priceData.volume,
        updated_at: new Date().toISOString()
    };

    try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/simplize_companies?symbol=eq.${priceData.symbol}`, {
            method: 'PATCH',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify(simplizePayload)
        });

        if (res.ok) {
            console.log(`  ✅ Updated simplize_companies`);
        } else {
            console.log(`  ⚠️ simplize_companies: ${res.status} - ${await res.text()}`);
        }

        const pricePayload = {
            symbol: priceData.symbol,
            trading_date: today,
            open_price: priceData.open,
            high_price: priceData.high,
            low_price: priceData.low,
            close_price: priceData.price,
            volume: priceData.volume
        };

        const res2 = await fetch(`${SUPABASE_URL}/rest/v1/stock_prices`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'resolution=merge-duplicates'
            },
            body: JSON.stringify(pricePayload)
        });

        if (res2.ok) {
            console.log(`  ✅ Updated stock_prices`);
        } else {
            console.log(`  ⚠️ stock_prices: ${res2.status}`);
        }

        return res.ok || res2.ok;
    } catch (e) {
        console.log(`  ❌ DB error for ${priceData.symbol}: ${e.message}`);
        return false;
    }
}

async function syncStock(symbol) {
    console.log(`\n📊 Syncing ${symbol}...`);
    
    const price = await fetchSimplizePrice(symbol);
    if (!price) return false;

    console.log(`  💰 ${symbol}: ${price.price.toLocaleString()} VND (${price.changePercent >= 0 ? '+' : ''}${price.changePercent.toFixed(2)}%)`);
    
    const success = await updateSupabase(price);
    return success;
}

async function syncAll(symbols) {
    console.log(`\n🚀 Starting sync for ${symbols.length} stocks...\n`);
    
    let success = 0;
    let failed = 0;
    
    for (const symbol of symbols) {
        const ok = await syncStock(symbol);
        if (ok) success++;
        else failed++;
        
        await new Promise(r => setTimeout(r, 300));
    }
    
    console.log(`\n========================================`);
    console.log(`🎉 Sync completed!`);
    console.log(`   ✅ Success: ${success}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log(`========================================\n`);
}

const args = process.argv.slice(2);

if (args.length > 0) {
    const symbols = args.map(s => s.toUpperCase());
    syncAll(symbols);
} else {
    console.log('📈 Syncing VN30 stocks from Simplize API...');
    syncAll(VN30);
}
