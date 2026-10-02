const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const lines = fs.readFileSync(filePath, 'utf-8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) continue;
    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();
    process.env[key] = process.env[key] || value;
  }
}

// Load env from backend
loadEnvFile('/Users/dineshpabbathi/Desktop/lotus-lion-ecommerce-master/backend/.env');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkOrdersCols() {
  const { data, error } = await supabase.from('orders').select('*').limit(1);
  if (error) {
    console.error('Error fetching order:', error.message);
  } else if (data && data.length > 0) {
    console.log('Order columns:', Object.keys(data[0]));
  } else {
    console.log('No orders exist in the database yet. Attempting RPC custom schema fetch...');
    // We can run a query to get column names of 'orders'
    const { data: cols, error: err } = await supabase.rpc('exec', {
      sql: "SELECT column_name FROM information_schema.columns WHERE table_name = 'orders';"
    }).catch((e) => ({ data: null, error: e }));
    if (err) {
      console.log('RPC failed:', err.message || err);
      // Let's try select * with limit 0
      const { data: d, error: e } = await supabase.from('orders').select('*').limit(0);
      if (e) {
        console.error('Select failed:', e.message);
      } else {
        console.log('Select 0 returned keys:', d);
      }
    } else {
      console.log('Columns from schema:', cols);
    }
  }
}
checkOrdersCols();
