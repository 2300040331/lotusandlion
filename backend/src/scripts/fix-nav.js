require('dotenv').config();
const { query, pool } = require('../config/database');

async function cleanAndSeedNav() {
  console.log('🚀 Updating and Reseeding Navbar (No Blog)...');

  const NAVBAR_DATA = [
    { label: 'Lotus Collections', href: '/collections/lotus' },
    { label: 'Lion Collections', href: '/collections/lion' },
    { label: 'Shop All', href: '/products' },
  ];

  try {
    await query(
      `INSERT INTO content (key, type, data, updated_at)
       VALUES ('navbar', 'config', $1, NOW())
       ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
      [JSON.stringify(NAVBAR_DATA)]
    );
    console.log('✅ Navbar updated successfully without blog.');

    await query(
      `INSERT INTO collections (name, slug, is_active, display_order)
       VALUES ('Lotus Collections', 'lotus', true, 1)
       ON CONFLICT (slug) DO UPDATE SET is_active = true, display_order = 1`
    );

    await query(
      `INSERT INTO collections (name, slug, is_active, display_order)
       VALUES ('Lion Collections', 'lion', true, 2)
       ON CONFLICT (slug) DO UPDATE SET is_active = true, display_order = 2`
    );

    console.log('✅ Collections seeded.');
  } catch (err) {
    console.error('Error in fix-nav:', err.message);
  } finally {
    await pool.end();
  }
}

cleanAndSeedNav();
