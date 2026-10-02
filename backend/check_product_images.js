require('dotenv').config();
const supabase = require('./src/config/supabase');

async function checkProductImages() {
  const { data: images, error: iError } = await supabase.from('product_images').select('*').limit(1);
  if (iError) {
    console.error('Error fetching images:', iError);
    return;
  }
  if (images && images[0]) {
    console.log('Columns in product_images:', Object.keys(images[0]));
    console.log('Sample image:', images[0]);
  } else {
    console.log('product_images table is empty');
  }
}

checkProductImages();
