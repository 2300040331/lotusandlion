require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSlider() {
  const { data, error } = await supabase
    .from('homepage_sections')
    .select('*')
    .eq('section_key', 'hero-slider')
    .single();

  if (error) {
    console.error('Error fetching slider:', error);
  } else {
    console.log('Slider content:', JSON.stringify(data.content, null, 2));
  }
}

checkSlider();
