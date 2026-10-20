const { query } = require('../config/database');
const { remember } = require('../services/cacheService');

const mapToCamelCase = (p) => {
  if (!p) return null;

  let images = [];
  if (p.images && Array.isArray(p.images) && p.images.length > 0) {
    images = p.images
      .map((img) => (typeof img === 'string' ? img : img?.image_url))
      .filter(Boolean);
  } else if (p.image_url) {
    images = [p.image_url];
  }
  const mainImage = images[0] || null;

  return {
    _id: p.id,
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description,
    richDescription: p.rich_description,
    price: Number(p.price) || 0,
    discountPrice: p.discount_price !== null && p.discount_price !== undefined ? Number(p.discount_price) : null,
    category: p.category,
    collection: p.collection_id,
    collectionType: p.collection_id,
    countInStock: Number(p.stock_quantity) || 0,
    isFeatured: Boolean(p.is_featured),
    isVisible: Boolean(p.is_visible),
    image: mainImage,
    images: images,
    variants: p.variants || [],
    brand: 'Lotus & Lion',
  };
};

const getProductsCacheKey = (q) => {
  const { keyword, category, collectionType, page = 1, limit = 12 } = q;
  return `products:list:${collectionType || 'all'}:${category || 'all'}:${keyword || 'all'}:p${page}:l${limit}`;
};

// @route GET /api/products
const getProducts = async (req, res, next) => {
  try {
    const { keyword, category, collectionType, page = 1, limit = 12 } = req.query;
    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit)));
    const offset = (pageNum - 1) * limitNum;

    const cacheKey = getProductsCacheKey(req.query);

    const data = await remember(cacheKey, async () => {
      const conditions = ['p.is_visible = true'];
      const params = [];
      let paramIdx = 1;

      if (keyword) {
        conditions.push(`p.name ILIKE $${paramIdx++}`);
        params.push(`%${keyword}%`);
      }
      if (category) {
        conditions.push(`p.category = $${paramIdx++}`);
        params.push(category);
      }
      if (collectionType) {
        // Support collection UUID or slug
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(collectionType);
        if (isUuid) {
          conditions.push(`p.collection_id = $${paramIdx++}`);
          params.push(collectionType);
        } else {
          conditions.push(`p.collection_id IN (SELECT id FROM collections WHERE slug = $${paramIdx++})`);
          params.push(collectionType.toLowerCase());
        }
      }

      const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
      params.push(limitNum);
      const limitParam = `$${paramIdx++}`;
      params.push(offset);
      const offsetParam = `$${paramIdx++}`;

      const sql = `
        SELECT p.id, p.name, p.slug, p.price, p.discount_price, p.category, p.stock_quantity,
               p.is_featured, p.is_visible, p.collection_id, p.description, p.rich_description,
               COALESCE(
                 (SELECT json_agg(json_build_object('image_url', pi.image_url) ORDER BY pi.is_main DESC, pi.display_order ASC)
                  FROM product_images pi WHERE pi.product_id = p.id),
                 '[]'::json
               ) AS images
        FROM products p
        ${whereClause}
        ORDER BY p.created_at DESC
        LIMIT ${limitParam} OFFSET ${offsetParam}
      `;

      const { rows } = await query(sql, params);
      return rows.map(mapToCamelCase);
    }, 600);

    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=1200');
    res.json(data);
  } catch (error) {
    next(error);
  }
};

// @route GET /api/products/:slug
const getProductBySlug = async (req, res, next) => {
  try {
    const identifier = req.params.slug.toLowerCase().trim();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
    const cacheKey = `product:${isUuid ? 'id' : 'slug'}:${identifier}`;

    const data = await remember(cacheKey, async () => {
      const condition = isUuid ? 'p.id = $1' : 'p.slug = $1';
      const sql = `
        SELECT p.id, p.name, p.slug, p.description, p.rich_description, p.price, p.discount_price,
               p.category, p.stock_quantity, p.is_featured, p.is_visible, p.collection_id,
               COALESCE(
                 (SELECT json_agg(json_build_object('image_url', pi.image_url) ORDER BY pi.is_main DESC, pi.display_order ASC)
                  FROM product_images pi WHERE pi.product_id = p.id),
                 '[]'::json
               ) AS images,
               COALESCE(
                 (SELECT json_agg(pv.*) FROM product_variants pv WHERE pv.product_id = p.id),
                 '[]'::json
               ) AS variants
        FROM products p
        WHERE p.is_visible = true AND ${condition}
        LIMIT 1
      `;

      const { rows } = await query(sql, [identifier]);
      if (!rows.length) return null;
      return mapToCamelCase(rows[0]);
    }, 1800);

    if (!data) {
      res.status(404);
      throw new Error('Product not found');
    }

    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600');
    res.json(data);
  } catch (error) {
    next(error);
  }
};

// @route GET /api/products/featured
const getFeaturedProducts = async (req, res, next) => {
  try {
    const cacheKey = 'products:featured:latest';

    const data = await remember(cacheKey, async () => {
      const sql = `
        SELECT p.id, p.name, p.slug, p.price, p.discount_price, p.stock_quantity,
               p.is_featured, p.is_visible, p.collection_id,
               COALESCE(
                 (SELECT json_agg(json_build_object('image_url', pi.image_url) ORDER BY pi.is_main DESC, pi.display_order ASC)
                  FROM product_images pi WHERE pi.product_id = p.id),
                 '[]'::json
               ) AS images
        FROM products p
        WHERE p.is_featured = true AND p.is_visible = true
        ORDER BY p.created_at DESC
        LIMIT 8
      `;

      const { rows } = await query(sql);
      return rows.map(mapToCamelCase);
    }, 900);

    res.setHeader('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=1800');
    res.json(data);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProducts,
  getProductBySlug,
  getFeaturedProducts,
  getTrendingProducts: async (req, res) => res.json([]),
};
