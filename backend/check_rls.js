require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Using URL:', supabaseUrl);
console.log('Using Key (first 10 chars):', anonKey.slice(0, 10));

const supabase = createClient(supabaseUrl, anonKey);

async function checkRLS() {
  const { data: cols, error: colErr } = await supabase.from('collections').select('*');
  console.log('Anon collections query - error:', colErr, 'count:', cols?.length);

  const { data: prods, error: prodErr } = await supabase.from('products').select('*');
  console.log('Anon products query - error:', prodErr, 'count:', prods?.length);
}

checkRLS();
