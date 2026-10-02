require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkImages() {
  const { data, error } = await supabase.from('product_images').select('*').limit(5);
  if (error) {
    console.error('Error fetching images:', error);
  } else {
    console.log('Sample images:', data);
  }
}

checkImages();
