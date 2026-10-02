const supabase = require('../config/supabase');
const { remember, flush } = require('../services/cacheService');

const mapProductToCamelCase = (p) => {
  if (!p) return null;
  
  let images = [];
  if (p.images && Array.isArray(p.images) && p.images.length > 0) {
    images = p.images
      .map(img => (typeof img === 'string' ? img : img?.image_url))
      .filter(Boolean);
  }
  const mainImage = images[0] || null;

  return {
    _id: p.id,
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description,
    richDescription: p.rich_description,
    price: p.price,
    discountPrice: p.discount_price,
    category: p.category,
    collection: p.collection_id,
    collectionType: p.collection_id,
    countInStock: p.stock_quantity,
    isFeatured: p.is_featured,
    isVisible: p.is_visible,
    image: mainImage,
    images: images,
    variants: p.variants || [],
    brand: 'Lotus & Lion'
  };
};

/**
 * @route GET /api/collections/:slug/products
 * @desc Get all products for a specific collection (for Men's/Women's pages)
 */
const getCollectionProducts = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const { page = 1, limit = 12, sort = '-created_at' } = req.query;
    
    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit)));
    const from = (pageNum - 1) * limitNum;
    const to = from + limitNum - 1;

    const cacheKey = `collection:${slug}:products:p${pageNum}:l${limitNum}`;

    const data = await remember(cacheKey, async () => {
      // First, get the collection by slug
      const { data: collection, error: collError } = await supabase
        .from('collections')
        .select('id, name, description, slug, is_active')
        .eq('slug', slug.toLowerCase())
        .eq('is_active', true)
        .single();

      if (collError || !collection) {
        return { collection: null, products: [], total: 0 };
      }
      
      collection.is_visible = collection.is_active;

      // Then get products for this collection
      let query = supabase
        .from('products')
        .select('id, name, slug, price, discount_price, category, stock_quantity, is_featured, is_visible, collection_id, images:product_images(image_url)', { count: 'exact' })
        .eq('collection_id', collection.id)
        .eq('is_visible', true);

      // Handle sorting
      const orderField = sort.startsWith('-') ? sort.substring(1) : sort;
      const ascending = !sort.startsWith('-');
      query = query.order(orderField, { ascending });

      const { data: products, count, error: prodError } = await query.range(from, to);

      if (prodError) throw prodError;

      return {
        collection,
        products: products.map(mapProductToCamelCase),
        total: count || 0
      };
    }, 900); // 15 min cache

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
        pages: Math.ceil(data.total / limitNum)
      }
    });
  } catch (error) { next(error); }
};

/**
 * @route GET /api/collections
 * @desc Get all visible collections
 */
const getCollections = async (req, res, next) => {
  try {
    const cacheKey = 'collections:all:visible';

    const data = await remember(cacheKey, async () => {
      const { data: collections, error } = await supabase
        .from('collections')
        .select('id, name, description, slug, is_active, created_at')
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      return (collections || []).map(c => ({
        ...c,
        is_visible: c.is_active
      }));
    }, 1800); // 30 min cache

    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600');
    res.json(data);
  } catch (error) { next(error); }
};

/**
 * @route GET /api/collections/:slug
 * @desc Get a single collection by slug
 */
const getCollectionBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const cacheKey = `collection:${slug.toLowerCase()}:details`;

    const data = await remember(cacheKey, async () => {
      const { data: collection, error } = await supabase
        .from('collections')
        .select('*')
        .eq('slug', slug.toLowerCase())
        .eq('is_active', true)
        .single();

      if (error || !collection) {
        return null;
      }
      collection.is_visible = collection.is_active;
      return collection;
    }, 1800); // 30 min cache

    if (!data) {
      res.status(404);
      throw new Error(`Collection "${slug}" not found`);
    }

    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600');
    res.json(data);
  } catch (error) { next(error); }
};

/**
 * Invalidate collection-related caches (for admin updates)
 */
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
  invalidateCollectionCache
};
