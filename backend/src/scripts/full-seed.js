require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  console.log('🚀 Final Seeding with Slider and WhatsApp...');

  // 1. Admin
  const hashedPassword = await bcrypt.hash('Admin123!', 10);
  await supabase.from('users').upsert({
    email: 'admin@lotusandlion.com',
    password: hashedPassword,
    name: 'Super Admin',
    role: 'super-admin',
    is_active: true
  }, { onConflict: 'email' });

  // 2. Collections
  const COLLECTIONS = [
    { name: 'Lotus Collections', slug: 'lotus', description: 'Womenswear archive.', display_order: 1 },
    { name: 'Lion Collections', slug: 'lion', description: 'Menswear tailoring.', display_order: 2 }
  ];
  const { data: colls } = await supabase.from('collections').upsert(COLLECTIONS, { onConflict: 'slug' }).select();

  // 3. Products
  const PRODUCTS = [
    { name: 'Signature Lotus Wrap', slug: 'lotus-wrap', price: 4500, is_featured: true, is_trending: true, is_visible: true, stock_quantity: 10, collection_slug: 'lotus' },
    { name: 'Lion Tailored Shirt', slug: 'lion-shirt', price: 3200, is_featured: true, is_trending: true, is_visible: true, stock_quantity: 10, collection_slug: 'lion' }
  ];

  for (const p of PRODUCTS) {
    const { collection_slug, ...pData } = p;
    const coll = colls.find(c => c.slug === collection_slug);
    const { data: product } = await supabase.from('products').upsert({ ...pData, collection_id: coll?.id }, { onConflict: 'slug' }).select().single();
    if (product) {
       await supabase.from('product_images').delete().eq('product_id', product.id);
       await supabase.from('product_images').insert({
         product_id: product.id,
         image_url: p.slug === 'lotus-wrap'
           ? 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=800&q=80'
           : 'https://images.unsplash.com/photo-1507679722338-958cf635959e?auto=format&fit=crop&w=800&q=80',
         is_main: true
       });
    }
  }

  // 4. Slider Data
  await supabase.from('homepage_sections').upsert({
    section_key: 'hero-slider',
    title: 'Main Slider',
    type: 'slider',
    is_active: true,
    content: {
      slides: [
        {
          title: 'Lotus & Lion',
          subtitle: 'Original artist-led outfits for everyday and occasion wear.',
          eyebrow: 'Online Exclusive',
          ctaText: 'Shop Now',
          ctaLink: '/collections/lotus',
          image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1600&q=80'
        },
        {
          title: 'The Lion Tailoring',
          subtitle: 'Structured layers and quiet detail for the modern man.',
          eyebrow: 'New Season',
          ctaText: 'Explore Collection',
          ctaLink: '/collections/lion',
          image: 'https://images.unsplash.com/photo-1507679722338-958cf635959e?auto=format&fit=crop&w=1600&q=80'
        }
      ]
    }
  }, { onConflict: 'section_key' });

  // 5. Website Settings (WhatsApp)
  await supabase.from('website_settings').upsert({
    site_name: 'Lotus & Lion',
    site_description: 'Modern luxury clothing for the pioneer.',
    whatsapp_number: '919876543210' // Default number
  });

  console.log('✨ Final Seed Finished Successfully!');
}

seed();
