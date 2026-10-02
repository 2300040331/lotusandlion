require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDetails() {
  const { data: collections } = await supabase.from('collections').select('*');
  console.log('--- COLLECTIONS ---');
  collections.forEach(c => {
    console.log(`Collection: ${c.name} (${c.slug}) | ID: ${c.id}`);
  });

  const { data: products } = await supabase.from('products').select('*');
  console.log('\n--- PRODUCTS ---');
  for (const p of products) {
    const coll = collections.find(c => c.id === p.collection_id);
    const { data: images } = await supabase.from('product_images').select('*').eq('product_id', p.id);
    console.log(`Product: ${p.name} (${p.slug}) | Coll: ${coll ? coll.slug : 'None'} | Price: ${p.price} | Visible: ${p.is_visible} | Images: ${images.length}`);
    if (images.length > 0) {
      console.log('  Image URL:', images[0].image_url);
    }
  }
}

checkDetails();
