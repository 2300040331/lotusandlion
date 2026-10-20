require('dotenv').config();
const bcrypt = require('bcryptjs');
const { query, pool } = require('../config/database');

async function createAdmin() {
  const email = process.env.ADMIN_EMAIL || 'admin@lotusandlion.com';
  const password = process.env.ADMIN_PASSWORD || 'Password123!';
  const name = process.env.ADMIN_NAME || 'Super Admin';

  console.log(`Creating/updating admin user: ${email}...`);

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const { rows } = await query(
      `INSERT INTO profiles (email, password, name, role, is_blocked)
       VALUES ($1, $2, $3, 'super-admin', false)
       ON CONFLICT (email)
       DO UPDATE SET password = EXCLUDED.password, name = EXCLUDED.name, role = 'super-admin', is_blocked = false
       RETURNING id, name, email, role`,
      [email, hashedPassword, name]
    );

    console.log('✅ Admin user ready:');
    console.log('   Email:', rows[0].email);
    console.log('   Role:', rows[0].role);
  } catch (err) {
    console.error('Error creating admin:', err.message);
  } finally {
    await pool.end();
  }
}

createAdmin();
