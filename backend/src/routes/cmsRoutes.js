const express = require('express');
const supabase = require('../config/supabase');
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
    price: p.price,
    discountPrice: p.discount_price,
    image: gallery[0] || p.image_url,
    images: gallery,
    brand: 'Lotus & Lion',
    category: p.category,
    countInStock: p.stock_quantity,
    collectionType: p.collection_id
  };
};

router.get('/site', async (req, res, next) => {
  try {
    const data = await remember('content:site', async () => {
      // 1. Fetch base configuration in parallel
      const [
        { data: sections },
        { data: collections },
        { data: contentItems },
        { data: announcements }
      ] = await Promise.all([
        supabase.from('homepage_sections').select('*').order('display_order'),
        supabase.from('collections').select('*').order('display_order'),
        supabase.from('content').select('*'),
        supabase.from('announcements').select('*').limit(5)
      ]);

      const lotusId = collections?.find(c => c.slug === 'lotus')?.id;
      const lionId = collections?.find(c => c.slug === 'lion')?.id;

      // 2. Fetch products in parallel using identified IDs
      // We only select the fields needed for the homepage to keep the payload small
      const productSelect = 'id, name, slug, price, discount_price, category, stock_quantity, is_featured, collection_id, product_images(image_url, is_main, display_order)';
      
      const [
        { data: featuredProducts },
        { data: lotusProducts },
        { data: lionProducts }
      ] = await Promise.all([
        supabase.from('products').select(productSelect).eq('is_featured', true).eq('is_visible', true).limit(12),
        lotusId ? supabase.from('products').select(productSelect).eq('collection_id', lotusId).eq('is_visible', true).eq('is_featured', true).limit(8) : { data: [] },
        lionId ? supabase.from('products').select(productSelect).eq('collection_id', lionId).eq('is_visible', true).eq('is_featured', true).limit(8) : { data: [] }
      ]);

      const findContent = (key) => contentItems?.find(c => c.key === key)?.data || (key === 'navbar' || key === 'footer' ? [] : {});

      return {
        home: findContent('home'),
        navbar: findContent('navbar'),
        footer: findContent('footer'),
        collections: (collections || []).map(c => ({
          ...c,
          categories: c.hero?.categories || [],
          dropSchedules: c.hero?.dropSchedules || []
        })),
        sections: sections || [],
        announcements: announcements || [],
        theme: findContent('theme'),
        settings: findContent('settings'),
        blogs: [], 
        featuredProducts: (featuredProducts || []).map(mapProduct),
        lotusProducts: (lotusProducts || []).map(mapProduct),
        lionProducts: (lionProducts || []).map(mapProduct)
      };
    }, 60); // 60 second cache
    // Set Cache-Control header for Vercel Edge Caching
    // s-maxage=60: cache for 60 seconds on the CDN
    // stale-while-revalidate=3600: serve stale content for up to an hour while fetching fresh data in the background
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=3600');
    res.json(data);
  } catch (error) {
    next(error);
  }
});

router.get('/settings', async (req, res, next) => {
  try {
    const { data, error } = await supabase.from('content').select('*').eq('key', 'settings').single();
    if (error && error.code !== 'PGRST116') throw error;
    res.json(data?.data || {});
  } catch (error) {
    next(error);
  }
});

router.get('/collections/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // 1. Fetch the collection details
    const { data: collection, error: colError } = await supabase
      .from('collections')
      .select('*')
      .eq('id', id)
      .single();

    if (colError) throw colError;

    // 2. Fetch the products in this collection
    const { data: products, error: prodError } = await supabase
      .from('products')
      .select('*, images:product_images(*)')
      .eq('collection_id', id);

    if (prodError) throw prodError;

    res.json({
      ...collection,
      categories: collection.hero?.categories || [],
      dropSchedules: collection.hero?.dropSchedules || [],
      products: (products || []).map(mapProduct)
    });
  } catch (error) {
    next(error);
  }
});

router.get('/blogs', async (req, res, next) => {
  try {
    const { data, error } = await supabase.from('blogs').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data.map(b => ({ ...b, _id: b.id })));
  } catch (error) { next(error); }
});

router.get('/blogs/:slug', async (req, res, next) => {
  try {
    const { data, error } = await supabase.from('blogs').select('*').eq('slug', req.params.slug).single();
    if (error || !data) { res.status(404); throw new Error('Blog not found'); }
    res.json({ ...data, _id: data.id });
  } catch (error) { next(error); }
});

module.exports = router;
