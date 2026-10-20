require('dotenv').config();
const { query, pool } = require('../config/database');

async function initDatabase() {
  console.log('⚡ Initializing Lotus & Lion PostgreSQL schema...');

  const schemaSql = `
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";

    -- 1. Profiles (Users & Admins)
    CREATE TABLE IF NOT EXISTS profiles (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(50) DEFAULT 'customer',
      is_blocked BOOLEAN DEFAULT false,
      last_login TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- 2. Collections
    CREATE TABLE IF NOT EXISTS collections (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      slug VARCHAR(255) UNIQUE NOT NULL,
      description TEXT,
      banner_url TEXT,
      is_active BOOLEAN DEFAULT true,
      display_order INT DEFAULT 0,
      hero JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- 3. Products
    CREATE TABLE IF NOT EXISTS products (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      slug VARCHAR(255) UNIQUE NOT NULL,
      description TEXT,
      rich_description TEXT,
      price NUMERIC(10, 2) NOT NULL DEFAULT 0,
      discount_price NUMERIC(10, 2),
      category VARCHAR(100),
      collection_id UUID REFERENCES collections(id) ON DELETE SET NULL,
      stock_quantity INT DEFAULT 0,
      is_featured BOOLEAN DEFAULT false,
      is_visible BOOLEAN DEFAULT true,
      is_flash_sale BOOLEAN DEFAULT false,
      release_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- 4. Product Images
    CREATE TABLE IF NOT EXISTS product_images (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      product_id UUID REFERENCES products(id) ON DELETE CASCADE,
      image_url TEXT NOT NULL,
      is_main BOOLEAN DEFAULT false,
      display_order INT DEFAULT 0,
      alt_text VARCHAR(255),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- 5. Product Variants (Sizes & Colors)
    CREATE TABLE IF NOT EXISTS product_variants (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      product_id UUID REFERENCES products(id) ON DELETE CASCADE,
      size VARCHAR(50),
      color VARCHAR(50) DEFAULT 'Default',
      quantity INT DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- 6. Orders
    CREATE TABLE IF NOT EXISTS orders (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
      order_items JSONB NOT NULL DEFAULT '[]'::jsonb,
      shipping_address JSONB NOT NULL DEFAULT '{}'::jsonb,
      payment_method VARCHAR(100) DEFAULT 'Razorpay',
      payment_result JSONB DEFAULT '{}'::jsonb,
      items_price NUMERIC(10, 2) DEFAULT 0,
      shipping_price NUMERIC(10, 2) DEFAULT 0,
      tax_price NUMERIC(10, 2) DEFAULT 0,
      total_price NUMERIC(10, 2) DEFAULT 0,
      is_paid BOOLEAN DEFAULT false,
      paid_at TIMESTAMP WITH TIME ZONE,
      is_delivered BOOLEAN DEFAULT false,
      delivered_at TIMESTAMP WITH TIME ZONE,
      status VARCHAR(50) DEFAULT 'pending',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- 7. Bookings (Tailoring Consultations & Atelier Sessions)
    CREATE TABLE IF NOT EXISTS bookings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      phone VARCHAR(50),
      booking_type VARCHAR(100) DEFAULT 'atelier_consultation',
      booking_date DATE NOT NULL,
      time_slot VARCHAR(50),
      location VARCHAR(255) DEFAULT 'Atelier Studio',
      notes TEXT,
      status VARCHAR(50) DEFAULT 'pending',
      payment_status VARCHAR(50) DEFAULT 'unpaid',
      metadata JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- 8. Media Uploads (Tracking uploaded image assets)
    CREATE TABLE IF NOT EXISTS media_uploads (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      filename VARCHAR(255) NOT NULL,
      url TEXT NOT NULL,
      public_id VARCHAR(255),
      folder VARCHAR(100) DEFAULT 'products',
      mime_type VARCHAR(100),
      file_size BIGINT,
      uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- 9. CMS Content
    CREATE TABLE IF NOT EXISTS content (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      key VARCHAR(100) UNIQUE NOT NULL,
      type VARCHAR(50) DEFAULT 'general',
      data JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- 10. Homepage Sections
    CREATE TABLE IF NOT EXISTS homepage_sections (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      section_key VARCHAR(100) UNIQUE NOT NULL,
      title VARCHAR(255),
      content JSONB DEFAULT '{}'::jsonb,
      display_order INT DEFAULT 0,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- 11. Announcements
    CREATE TABLE IF NOT EXISTS announcements (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      message TEXT NOT NULL,
      placement VARCHAR(50) DEFAULT 'top',
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Strategic Performance Indexes
    CREATE INDEX IF NOT EXISTS idx_products_collection ON products(collection_id);
    CREATE INDEX IF NOT EXISTS idx_products_visible_featured ON products(is_visible, is_featured);
    CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);
    CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);
    CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
    CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(booking_date);
    CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
    CREATE INDEX IF NOT EXISTS idx_media_uploads_folder ON media_uploads(folder);
  `;

  try {
    await query(schemaSql);
    console.log('✅ PostgreSQL schema created successfully with all tables and indexes!');
  } catch (err) {
    console.error('❌ Error initializing database schema:', err);
  } finally {
    await pool.end();
  }
}

initDatabase();
