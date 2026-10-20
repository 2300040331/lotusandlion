const express = require('express');
const { query } = require('../config/database');
const { remember } = require('../services/cacheService');

const router = express.Router();

const mapProduct = (p) => {
  if (!p) return null;
  const gallery = (p.product_images || p.images || [])
    .slice()
    .sort((a, b) => {
      if (a?.is_main && !b?.is_main) return -1;
      if (!a?.is_main && b?.is_main) return 1;
      return (a?.display_order || 0) - (b?.display_order || 0);
    })
    .map((image) => (typeof image === 'string' ? image : image?.image_url))
    .filter(Boolean);

  return {
    _id: p.id,
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: Number(p.price) || 0,
    discountPrice: p.discount_price !== null && p.discount_price !== undefined ? Number(p.discount_price) : null,
    image: gallery[0] || p.image_url,
    images: gallery,
    brand: 'Lotus & Lion',
    category: p.category,
    countInStock: Number(p.stock_quantity) || 0,
    collectionType: p.collection_id,
  };
};

router.get('/site', async (req, res, next) => {
  try {
    const data = await remember('content:site', async () => {
      // 1. Fetch sections, collections, content items, announcements
      const [secRes, collRes, contentRes, annRes] = await Promise.all([
        query('SELECT * FROM homepage_sections ORDER BY display_order ASC'),
        query('SELECT * FROM collections ORDER BY display_order ASC, created_at ASC'),
        query('SELECT * FROM content'),
        query('SELECT * FROM announcements ORDER BY created_at DESC LIMIT 5'),
      ]);

      const sections = secRes.rows || [];
      const collections = collRes.rows || [];
      const contentItems = contentRes.rows || [];
      const announcements = annRes.rows || [];

      const lotusId = collections.find((c) => c.slug === 'lotus')?.id;
      const lionId = collections.find((c) => c.slug === 'lion')?.id;

      // 2. Fetch products
      const prodSql = `
        SELECT p.id, p.name, p.slug, p.price, p.discount_price, p.category, p.stock_quantity,
               p.is_featured, p.collection_id,
               COALESCE(
                 (SELECT json_agg(json_build_object('image_url', pi.image_url, 'is_main', pi.is_main, 'display_order', pi.display_order))
                  FROM product_images pi WHERE pi.product_id = p.id),
                 '[]'::json
               ) AS product_images
        FROM products p
        WHERE p.is_visible = true
      `;

      const [featuredRes, lotusRes, lionRes] = await Promise.all([
        query(`${prodSql} AND p.is_featured = true ORDER BY p.created_at DESC LIMIT 12`),
        lotusId
          ? query(`${prodSql} AND p.collection_id = $1 AND p.is_featured = true ORDER BY p.created_at DESC LIMIT 8`, [lotusId])
          : { rows: [] },
        lionId
          ? query(`${prodSql} AND p.collection_id = $1 AND p.is_featured = true ORDER BY p.created_at DESC LIMIT 8`, [lionId])
          : { rows: [] },
      ]);

      const findContent = (key) =>
        contentItems.find((c) => c.key === key)?.data || (key === 'navbar' || key === 'footer' ? [] : {});

      return {
        home: findContent('home'),
        navbar: findContent('navbar'),
        footer: findContent('footer'),
        collections: collections.map((c) => ({
          ...c,
          categories: c.hero?.categories || [],
          dropSchedules: c.hero?.dropSchedules || [],
        })),
        sections,
        announcements,
        theme: findContent('theme'),
        settings: findContent('settings'),
        featuredProducts: (featuredRes.rows || []).map(mapProduct),
        lotusProducts: (lotusRes.rows || []).map(mapProduct),
        lionProducts: (lionRes.rows || []).map(mapProduct),
      };
    }, 60);

    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=3600');
    res.json(data);
  } catch (error) {
    next(error);
  }
});

router.get('/settings', async (req, res, next) => {
  try {
    const { rows } = await query("SELECT data FROM content WHERE key = 'settings' LIMIT 1");
    res.json(rows[0]?.data || {});
  } catch (error) {
    next(error);
  }
});

router.get('/collections/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    const collSql = isUuid
      ? 'SELECT * FROM collections WHERE id = $1 LIMIT 1'
      : 'SELECT * FROM collections WHERE LOWER(slug) = LOWER($1) LIMIT 1';

    const { rows: collRows } = await query(collSql, [id]);
    const collection = collRows[0];

    if (!collection) {
      res.status(404);
      throw new Error('Collection not found');
    }

    const { rows: products } = await query(
      `SELECT p.*,
              COALESCE(
                (SELECT json_agg(pi.*) FROM product_images pi WHERE pi.product_id = p.id),
                '[]'::json
              ) AS product_images
       FROM products p
       WHERE p.collection_id = $1 AND p.is_visible = true
       ORDER BY p.created_at DESC`,
      [collection.id]
    );

    res.json({
      ...collection,
      categories: collection.hero?.categories || [],
      dropSchedules: collection.hero?.dropSchedules || [],
      products: products.map(mapProduct),
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
