require('dotenv').config();
const bcrypt = require('bcryptjs');
const { query, pool } = require('../config/database');

async function seed() {
  console.log('🚀 Seeding Lotus & Lion PostgreSQL Database...');

  try {
    // 1. Admin
    const hashedPassword = await bcrypt.hash('Admin123!', 10);
    await query(
      `INSERT INTO profiles (email, password, name, role, is_blocked)
       VALUES ('admin@lotusandlion.com', $1, 'Super Admin', 'super-admin', false)
       ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password, role = 'super-admin'`,
      [hashedPassword]
    );

    // 2. Collections
    const { rows: lotusColl } = await query(
      `INSERT INTO collections (name, slug, description, display_order, is_active)
       VALUES ('Lotus Collections', 'lotus', 'Womenswear archive.', 1, true)
       ON CONFLICT (slug) DO UPDATE SET is_active = true, display_order = 1
       RETURNING id, slug`
    );

    const { rows: lionColl } = await query(
      `INSERT INTO collections (name, slug, description, display_order, is_active)
       VALUES ('Lion Collections', 'lion', 'Menswear tailoring.', 2, true)
       ON CONFLICT (slug) DO UPDATE SET is_active = true, display_order = 2
       RETURNING id, slug`
    );

    const lotusId = lotusColl[0]?.id;
    const lionId = lionColl[0]?.id;

    // 3. Products
    const PRODUCTS = [
      {
        name: 'Signature Lotus Wrap',
        slug: 'lotus-wrap',
        price: 4500,
        is_featured: true,
        is_visible: true,
        stock_quantity: 10,
        collection_id: lotusId,
        image: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=800&q=80',
      },
      {
        name: 'Lion Tailored Shirt',
        slug: 'lion-shirt',
        price: 3200,
        is_featured: true,
        is_visible: true,
        stock_quantity: 10,
        collection_id: lionId,
        image: 'https://images.unsplash.com/photo-1507679722338-958cf635959e?auto=format&fit=crop&w=800&q=80',
      },
    ];

    for (const p of PRODUCTS) {
      const { rows: prodRows } = await query(
        `INSERT INTO products (name, slug, price, is_featured, is_visible, stock_quantity, collection_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (slug) DO UPDATE SET price = EXCLUDED.price, is_featured = EXCLUDED.is_featured, is_visible = true
         RETURNING id`,
        [p.name, p.slug, p.price, p.is_featured, p.is_visible, p.stock_quantity, p.collection_id]
      );

      const prodId = prodRows[0]?.id;
      if (prodId) {
        await query('DELETE FROM product_images WHERE product_id = $1', [prodId]);
        await query(
          'INSERT INTO product_images (product_id, image_url, is_main, display_order) VALUES ($1, $2, true, 0)',
          [prodId, p.image]
        );
      }
    }

    // 4. Slider Data
    await query(
      `INSERT INTO homepage_sections (section_key, title, is_active, display_order, content)
       VALUES ('hero-slider', 'Main Slider', true, 1, $1)
       ON CONFLICT (section_key) DO UPDATE SET content = EXCLUDED.content, is_active = true`,
      [
        JSON.stringify({
          slides: [
            {
              title: 'Lotus & Lion',
              subtitle: 'Original artist-led outfits for everyday and occasion wear.',
              eyebrow: 'Online Exclusive',
              ctaText: 'Shop Now',
              ctaLink: '/collections/lotus',
              image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1600&q=80',
            },
            {
              title: 'The Lion Tailoring',
              subtitle: 'Structured layers and quiet detail for the modern man.',
              eyebrow: 'New Season',
              ctaText: 'Explore Collection',
              ctaLink: '/collections/lion',
              image: 'https://images.unsplash.com/photo-1507679722338-958cf635959e?auto=format&fit=crop&w=1600&q=80',
            },
          ],
        }),
      ]
    );

    // 5. Settings
    await query(
      `INSERT INTO content (key, type, data, updated_at)
       VALUES ('settings', 'settings', $1, NOW())
       ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
      [
        JSON.stringify({
          site_name: 'Lotus & Lion',
          site_description: 'Modern luxury clothing for the pioneer.',
          whatsapp_number: '919876543210',
        }),
      ]
    );

    console.log('✨ Seed finished successfully!');
  } catch (err) {
    console.error('Error seeding DB:', err);
  } finally {
    await pool.end();
  }
}

seed();
