require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log('Query with release_date <= NOW():');
  const { data: d1 } = await supabase
    .from('products')
    .select('name, release_date')
    .eq('is_visible', true)
    .lte('release_date', new Date().toISOString());
  console.log(d1);

  console.log('\nQuery without release_date filter:');
  const { data: d2 } = await supabase
    .from('products')
    .select('name, release_date')
    .eq('is_visible', true);
  console.log(d2);
}

test();
