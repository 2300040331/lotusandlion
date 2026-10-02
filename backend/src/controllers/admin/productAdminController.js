const supabase = require('../../config/supabase');
const { flush } = require('../../services/cacheService');
const { uploadMultiple } = require('../../../src/services/storageService');

const mapToCamelCase = (p) => {
  if (!p) return null;
  
  // Handle both joined images and fallback image_url
  const images = (p.images?.map(img => typeof img === 'string' ? img : img.image_url) || [p.image_url]).filter(Boolean);
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
    isPublished: p.is_visible,
    flashSale: p.is_flash_sale,
    releaseDate: p.release_date || null,
    image: mainImage,
    images: images,
    variants: p.variants || [],
    sizes: (p.variants || []).reduce((acc, v) => {
      acc[v.size] = (acc[v.size] || 0) + (v.quantity || 0);
      return acc;
    }, { XS: 0, S: 0, M: 0, L: 0, XL: 0, XXL: 0 })
  };
};

const slugify = (value = '') => value.toString().toLowerCase().trim()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

// @route GET /api/admin/products
const getAdminProducts = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, search = '', sort = 'created_at' } = req.query;
    const from = (Number(page) - 1) * Number(limit);
    const to = from + Number(limit) - 1;

    let query = supabase
      .from('products')
      .select('*, collection:collections(name), images:product_images(image_url), variants:product_variants(*)', { count: 'exact' });

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    const { data, count, error } = await query
      .order(sort.startsWith('-') ? sort.substring(1) : sort, { ascending: !sort.startsWith('-') })
      .range(from, to);

    if (error) throw error;

    res.json({
      products: data.map(mapToCamelCase),
      page: Number(page),
      pages: Math.ceil((count || 0) / limit),
      total: count
    });
  } catch (error) { next(error); }
};

// @route GET /api/admin/products/:id
const getAdminProductById = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        collection:collections(*),
        images:product_images(*),
        variants:product_variants(*)
      `)
      .eq('id', req.params.id)
      .single();

    if (error || !data) {
      res.status(404);
      throw new Error('Product not found');
    }
    res.json(mapToCamelCase(data));
  } catch (error) { next(error); }
};

// Helper to resolve collection ID from slug if needed
const resolveCollectionId = async (idOrSlug) => {
  if (!idOrSlug) return null;
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug)) {
    return idOrSlug;
  }
  const { data } = await supabase.from('collections').select('id').eq('slug', idOrSlug).maybeSingle();
  return data?.id || null;
};

// @route POST /api/admin/products
const createProduct = async (req, res, next) => {
  try {
    const {
      name, slug, description, price, category, collectionType,
      countInStock, isFeatured, isVisible, releaseDate, discountPrice,
      image, images, sizes
    } = req.body;

    const resolvedCollectionId = await resolveCollectionId(collectionType);
    let productSlug = slugify(slug || name || `product-${Date.now()}`);

    // Resolve slug conflicts
    const { data: slugCheck } = await supabase
      .from('products')
      .select('id')
      .eq('slug', productSlug)
      .maybeSingle();

    if (slugCheck) {
      productSlug = `${productSlug}-${Math.random().toString(36).substring(2, 6)}`;
    }

    const { data: product, error: pError } = await supabase
      .from('products')
      .insert({
        name,
        slug: productSlug,
        description,
        price: !isNaN(Number(price)) ? Number(price) : 0,
        discount_price: !isNaN(Number(discountPrice)) ? Number(discountPrice) : null,
        category,
        collection_id: resolvedCollectionId,
        stock_quantity: !isNaN(Number(countInStock)) ? Number(countInStock) : 0,
        is_featured: isFeatured === true || isFeatured === 'true',
        is_visible: isVisible !== false && isVisible !== 'false',
        release_date: releaseDate || new Date().toISOString()
      })
      .select()
      .single();

    if (pError) throw pError;

    // Handle images if any in req.files or req.body.images
    if (req.files && req.files.length > 0) {
      const uploadResults = await uploadMultiple(req.files.map(f => f.buffer), `lotus-lion/products/${product.id}`);
      const imageInserts = uploadResults.map((res, i) => ({
        product_id: product.id,
        image_url: res.url,
        is_main: i === 0
      }));
      await supabase.from('product_images').insert(imageInserts);
    } else if (images && Array.isArray(images) && images.length > 0) {
      const imageInserts = images.map((img, i) => ({
        product_id: product.id,
        image_url: typeof img === 'string' ? img : (img.image_url || img.url),
        is_main: i === 0
      })).filter(img => img.image_url);
      await supabase.from('product_images').insert(imageInserts);
    }

    // Handle sizes/variants
    if (req.body.variants && Array.isArray(req.body.variants)) {
      const variantInserts = req.body.variants
        .filter(v => Number(v.quantity) > 0)
        .map(v => ({
          product_id: product.id,
          size: v.size,
          quantity: Number(v.quantity),
          color: v.color || 'Default'
        }));
      if (variantInserts.length > 0) {
        await supabase.from('product_variants').insert(variantInserts);
      }
    } else if (sizes) {
      const variantInserts = Object.entries(sizes)
        .filter(([_, qty]) => Number(qty) > 0)
        .map(([size, qty]) => ({
          product_id: product.id,
          size,
          quantity: Number(qty),
          color: 'Default'
        }));
      if (variantInserts.length > 0) {
        await supabase.from('product_variants').insert(variantInserts);
      }
    }

    await flush('products:*');
    await flush('products:list:*');
    await flush('products:featured:*');
    await flush('content:site');

    // Re-fetch full product with images
    const { data: fullProduct } = await supabase
      .from('products')
      .select('id, name, slug, price, discount_price, category, stock_quantity, is_featured, is_visible, collection_id, images:product_images(image_url), variants:product_variants(*)')
      .eq('id', product.id)
      .single();

    res.status(201).json(mapToCamelCase(fullProduct || product));
  } catch (error) { next(error); }
};

// @route PUT /api/admin/products/:id
const updateProduct = async (req, res, next) => {
  try {
    const {
      name, slug, description, price, category, collectionType,
      countInStock, isFeatured, isVisible, releaseDate, discountPrice,
      image, images, sizes
    } = req.body;

    const resolvedCollectionId = await resolveCollectionId(collectionType);

    const { data: product, error: pError } = await supabase
      .from('products')
      .update({
        name,
        description,
        price: !isNaN(Number(price)) ? Number(price) : undefined,
        discount_price: !isNaN(Number(discountPrice)) ? Number(discountPrice) : null,
        category,
        collection_id: resolvedCollectionId || undefined,
        stock_quantity: !isNaN(Number(countInStock)) ? Number(countInStock) : undefined,
        is_featured: isFeatured !== undefined ? (isFeatured === true || isFeatured === 'true') : undefined,
        is_visible: isVisible !== undefined ? (isVisible !== false && isVisible !== 'false') : undefined,
        release_date: releaseDate || undefined
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (pError) throw pError;
    
    // Sync images if provided
    if (images && Array.isArray(images)) {
      // Clear existing images first
      await supabase.from('product_images').delete().eq('product_id', req.params.id);
      
      // Insert new ones
      const imageInserts = images.map((img, i) => ({
        product_id: req.params.id,
        image_url: typeof img === 'string' ? img : (img.image_url || img.url),
        is_main: i === 0
      })).filter(img => img.image_url);
      if (imageInserts.length > 0) {
        await supabase.from('product_images').insert(imageInserts);
      }
    }

    // Sync sizes/variants
    if (req.body.variants && Array.isArray(req.body.variants)) {
      await supabase.from('product_variants').delete().eq('product_id', req.params.id);
      const variantInserts = req.body.variants
        .filter(v => Number(v.quantity) > 0)
        .map(v => ({
          product_id: req.params.id,
          size: v.size,
          quantity: Number(v.quantity),
          color: v.color || 'Default'
        }));
      if (variantInserts.length > 0) {
        await supabase.from('product_variants').insert(variantInserts);
      }
    } else if (sizes) {
      await supabase.from('product_variants').delete().eq('product_id', req.params.id);
      const variantInserts = Object.entries(sizes)
        .filter(([_, qty]) => Number(qty) > 0)
        .map(([size, qty]) => ({
          product_id: req.params.id,
          size,
          quantity: Number(qty),
          color: 'Default'
        }));
      if (variantInserts.length > 0) {
        await supabase.from('product_variants').insert(variantInserts);
      }
    }

    await flush('products:*');
    await flush('products:list:*');
    await flush('products:featured:*');
    await flush('content:site');
    if (product?.slug) {
      await flush(`product:slug:${product.slug}`);
    }

    // Re-fetch the full product with images so the response is accurate
    const { data: fullProduct } = await supabase
      .from('products')
      .select('id, name, slug, price, discount_price, category, stock_quantity, is_featured, is_visible, collection_id, images:product_images(image_url), variants:product_variants(*)')
      .eq('id', req.params.id)
      .single();

    res.json(mapToCamelCase(fullProduct || product));
  } catch (error) { next(error); }
};

// @route DELETE /api/admin/products/:id
const deleteProduct = async (req, res, next) => {
  try {
    const { error } = await supabase.from('products').delete().eq('id', req.params.id);
    if (error) throw error;
    await flush('products:*');
    await flush('content:site');
    res.json({ message: 'Product removed' });
  } catch (error) { next(error); }
};

// @route PATCH /api/admin/products/:id/featured
const toggleFeatured = async (req, res, next) => {
  try {
    const { data: current } = await supabase.from('products').select('is_featured, slug').eq('id', req.params.id).single();
    const { data, error } = await supabase.from('products').update({ is_featured: !current.is_featured }).eq('id', req.params.id).select().single();
    if (error) throw error;
    
    // Invalidate specific caches
    await flush('products:featured:*');
    await flush(`product:slug:${current.slug}`);
    await flush('products:list:*');
    await flush('content:site');
    
    res.json(mapToCamelCase(data));
  } catch (error) { next(error); }
};

// @route PATCH /api/admin/products/:id/visibility
const toggleVisibility = async (req, res, next) => {
  try {
    const { data: current } = await supabase.from('products').select('is_visible, slug').eq('id', req.params.id).single();
    const { data, error } = await supabase.from('products').update({ is_visible: !current.is_visible }).eq('id', req.params.id).select().single();
    if (error) throw error;
    
    // Invalidate specific caches
    await flush('products:featured:*');
    await flush(`product:slug:${current.slug}`);
    await flush('products:list:*');
    await flush('content:site');
    
    res.json(mapToCamelCase(data));
  } catch (error) { next(error); }
};

module.exports = {
  getAdminProducts,
  getAdminProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  toggleFeatured,
  toggleVisibility,
  applyBulkDiscount: async (req, res) => res.status(501).json({ message: 'Not implemented' })
};
