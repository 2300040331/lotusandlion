const { query } = require('../config/database');
const { remember, flush } = require('../services/cacheService');

const mapProductToCamelCase = (p) => {
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

/**
 * @route GET /api/collections/:slug/products
 */
const getCollectionProducts = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const { page = 1, limit = 12, sort = '-created_at' } = req.query;

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit)));
    const offset = (pageNum - 1) * limitNum;

    const cacheKey = `collection:${slug}:products:p${pageNum}:l${limitNum}`;

    const data = await remember(cacheKey, async () => {
      const { rows: collRows } = await query(
        'SELECT id, name, description, slug, is_active FROM collections WHERE LOWER(slug) = LOWER($1) AND is_active = true LIMIT 1',
        [slug]
      );
      const collection = collRows[0];

      if (!collection) {
        return { collection: null, products: [], total: 0 };
      }

      collection.is_visible = collection.is_active;

      const orderField = sort.startsWith('-') ? sort.substring(1) : sort;
      const validSortFields = ['created_at', 'price', 'name', 'stock_quantity'];
      const safeOrderField = validSortFields.includes(orderField) ? orderField : 'created_at';
      const orderDirection = sort.startsWith('-') ? 'DESC' : 'ASC';

      const countRes = await query(
        'SELECT COUNT(*) FROM products WHERE collection_id = $1 AND is_visible = true',
        [collection.id]
      );
      const total = Number(countRes.rows[0]?.count || 0);

      const prodSql = `
        SELECT p.id, p.name, p.slug, p.price, p.discount_price, p.category, p.stock_quantity,
               p.is_featured, p.is_visible, p.collection_id,
               COALESCE(
                 (SELECT json_agg(json_build_object('image_url', pi.image_url) ORDER BY pi.is_main DESC, pi.display_order ASC)
                  FROM product_images pi WHERE pi.product_id = p.id),
                 '[]'::json
               ) AS images
        FROM products p
        WHERE p.collection_id = $1 AND p.is_visible = true
        ORDER BY p.${safeOrderField} ${orderDirection}
        LIMIT $2 OFFSET $3
      `;

      const { rows: products } = await query(prodSql, [collection.id, limitNum, offset]);

      return {
        collection,
        products: products.map(mapProductToCamelCase),
        total,
      };
    }, 900);

    if (!data.collection) {
      res.status(404);
      throw new Error(`Collection "${slug}" not found`);
    }

    res.setHeader('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=1800');
    res.json({
      collection: data.collection,
      products: data.products,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: data.total,
        pages: Math.ceil(data.total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route GET /api/collections
 */
const getCollections = async (req, res, next) => {
  try {
    const cacheKey = 'collections:all:visible';

    const data = await remember(cacheKey, async () => {
      const { rows } = await query(
        'SELECT id, name, description, slug, is_active, created_at, hero, banner_url, display_order FROM collections WHERE is_active = true ORDER BY display_order ASC, created_at ASC'
      );
      return rows.map((c) => ({
        ...c,
        is_visible: c.is_active,
      }));
    }, 1800);

    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600');
    res.json(data);
  } catch (error) {
    next(error);
  }
};

/**
 * @route GET /api/collections/:slug
 */
const getCollectionBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const cacheKey = `collection:${slug.toLowerCase()}:details`;

    const data = await remember(cacheKey, async () => {
      const { rows } = await query(
        'SELECT * FROM collections WHERE LOWER(slug) = LOWER($1) AND is_active = true LIMIT 1',
        [slug]
      );
      const collection = rows[0];
      if (!collection) return null;
      collection.is_visible = collection.is_active;
      return collection;
    }, 1800);

    if (!data) {
      res.status(404);
      throw new Error(`Collection "${slug}" not found`);
    }

    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600');
    res.json(data);
  } catch (error) {
    next(error);
  }
};

const invalidateCollectionCache = async (slug = null) => {
  if (slug) {
    await flush(`collection:${slug}:*`);
  } else {
    await flush('collection:*');
    await flush('collections:*');
  }
};

module.exports = {
  getCollections,
  getCollectionBySlug,
  getCollectionProducts,
  invalidateCollectionCache,
};
