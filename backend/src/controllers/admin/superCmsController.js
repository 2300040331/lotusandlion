const supabase = require('../../config/supabase');
const { flush, remember } = require('../../services/cacheService');

const slugify = (value = '') => value.toString().toLowerCase().trim()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

const listCollections = async (req, res, next) => {
  try {
    const { data, error } = await supabase.from('collections').select('*').order('display_order');
    if (error) throw error;
    
    const formatted = (data || []).map(c => {
      c.categories = c.hero?.categories || [];
      c.dropSchedules = c.hero?.dropSchedules || [];
      return c;
    });
    
    res.json(formatted);
  } catch (error) { next(error); }
};

const getCollection = async (req, res, next) => {
  try {
    const { data: collection, error } = await supabase.from('collections').select('*').eq('slug', req.params.key).single();
    if (error) throw error;
    
    if (collection) {
      collection.categories = collection.hero?.categories || [];
      collection.dropSchedules = collection.hero?.dropSchedules || [];
    }
    
    const { data: products } = await supabase.from('products').select('*').eq('collection_id', collection.id).limit(50);
    res.json({ collection, products });
  } catch (error) { next(error); }
};

const updateCollection = async (req, res, next) => {
  try {
    const collectionSlug = req.params.key;
    const payload = { ...req.body };
    
    // Move categories and dropSchedules to hero JSONB
    payload.hero = payload.hero || {};
    if (payload.categories !== undefined) {
      payload.hero.categories = payload.categories;
    }
    if (payload.dropSchedules !== undefined) {
      payload.hero.dropSchedules = payload.dropSchedules;
    }
    
    // Clean up fields that don't exist on collections table
    const validFields = ['name', 'slug', 'description', 'banner_url', 'is_active', 'display_order', 'hero'];
    const cleanedPayload = {};
    for (const key of validFields) {
      if (payload[key] !== undefined) {
        cleanedPayload[key] = payload[key];
      }
    }

    const { data, error } = await supabase.from('collections').update(cleanedPayload).eq('slug', collectionSlug).select().single();
    if (error) throw error;
    
    if (data) {
      data.categories = data.hero?.categories || [];
      data.dropSchedules = data.hero?.dropSchedules || [];
    }
    
    // Invalidate cache for this specific collection and related products
    await flush(`collection:${collectionSlug}:*`);
    await flush('collections:*');
    await flush('products:list:*'); // Invalidate product lists since they might be filtered by collection
    await flush('content:site'); // Invalidate main page CMS payload
    
    res.json(data);
  } catch (error) { next(error); }
};

const upsertCollection = async (req, res, next) => {
  try {
    const payload = { ...req.body };
    payload.slug = slugify(payload.slug || payload.name || payload.title);
    
    // Move categories and dropSchedules to hero JSONB
    payload.hero = payload.hero || {};
    if (payload.categories !== undefined) {
      payload.hero.categories = payload.categories;
    }
    if (payload.dropSchedules !== undefined) {
      payload.hero.dropSchedules = payload.dropSchedules;
    }
    
    const validFields = ['name', 'slug', 'description', 'banner_url', 'is_active', 'display_order', 'hero'];
    const cleanedPayload = {};
    for (const key of validFields) {
      if (payload[key] !== undefined) {
        cleanedPayload[key] = payload[key];
      }
    }
    
    let result;
    if (payload.id || payload._id) {
      const id = payload.id || payload._id;
      const { data, error } = await supabase.from('collections').update(cleanedPayload).eq('id', id).select().single();
      if (error) throw error;
      result = data;
    } else {
      const { data, error } = await supabase.from('collections').insert(cleanedPayload).select().single();
      if (error) throw error;
      result = data;
    }
    
    if (result) {
      result.categories = result.hero?.categories || [];
      result.dropSchedules = result.hero?.dropSchedules || [];
    }
    
    await flush(`collection:${result.slug}:*`);
    await flush('collections:*');
    await flush('content:site');
    res.json(result);
  } catch (error) { next(error); }
};

const deleteCollection = async (req, res, next) => {
  try {
    const { error } = await supabase.from('collections').delete().eq('id', req.params.id);
    if (error) throw error;
    await flush('collections:*');
    await flush('content:site');
    res.json({ message: 'Collection deleted' });
  } catch (error) { next(error); }
};

const listBlogs = async (req, res, next) => {
  try {
    const { data, error } = await supabase.from('blogs').select('*').order('updated_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (error) { next(error); }
};

const upsertBlog = async (req, res, next) => {
  try {
    const payload = { ...req.body };
    payload.slug = slugify(payload.slug || payload.title);
    
    let result;
    if (payload.id || payload._id) {
      const id = payload.id || payload._id;
      delete payload._id; delete payload.id;
      const { data, error } = await supabase.from('blogs').update(payload).eq('id', id).select().single();
      if (error) throw error;
      result = data;
    } else {
      const { data, error } = await supabase.from('blogs').insert(payload).select().single();
      if (error) throw error;
      result = data;
    }
    await flush('content:*');
    res.json(result);
  } catch (error) { next(error); }
};

const deleteBlog = async (req, res, next) => {
  try {
    const { error } = await supabase.from('blogs').delete().eq('id', req.params.id);
    if (error) throw error;
    await flush('content:*');
    res.json({ message: 'Blog deleted' });
  } catch (error) { next(error); }
};

const listSections = async (req, res, next) => {
  try {
    const { data, error } = await supabase.from('homepage_sections').select('*').order('display_order');
    if (error) throw error;
    res.json(data);
  } catch (error) { next(error); }
};

const upsertSection = async (req, res, next) => {
  try {
    const payload = { ...req.body };
    let result;
    if (payload.id || payload._id) {
      const id = payload.id || payload._id;
      delete payload._id; delete payload.id;
      const { data, error } = await supabase.from('homepage_sections').update(payload).eq('id', id).select().single();
      if (error) throw error;
      result = data;
    } else {
      const { data, error } = await supabase.from('homepage_sections').insert(payload).select().single();
      if (error) throw error;
      result = data;
    }
    await flush('content:*');
    res.json(result);
  } catch (error) { next(error); }
};

const deleteSection = async (req, res, next) => {
  try {
    const { error } = await supabase.from('homepage_sections').delete().eq('id', req.params.id);
    if (error) throw error;
    await flush('content:*');
    res.json({ message: 'Section deleted' });
  } catch (error) { next(error); }
};

const getControlCenter = async (req, res, next) => {
  try {
    const [
      { data: collections },
      { data: blogs },
      { data: sections },
      { data: announcements }
    ] = await Promise.all([
      supabase.from('collections').select('*'),
      supabase.from('blogs').select('*').limit(10),
      supabase.from('homepage_sections').select('*').order('display_order'),
      supabase.from('announcements').select('*').limit(10)
    ]);

    res.json({
      modules: ['Homepage Builder', 'Products', 'Collections', 'Blogs', 'Sections', 'Announcements'],
      collections: collections || [],
      blogs: blogs || [],
      sections: sections || [],
      announcements: announcements || []
    });
  } catch (error) { next(error); }
};

module.exports = {
  listCollections, getCollection, updateCollection, upsertCollection, deleteCollection,
  listBlogs, upsertBlog, deleteBlog,
  listSections, upsertSection, deleteSection,
  getControlCenter,
  getPublishedBlogs: listBlogs, // Simplified
  listAnnouncements: async (req, res) => res.json([]), // Stub
  upsertAnnouncement: async (req, res) => res.json({}), // Stub
  getTheme: async (req, res) => res.json({}), // Stub
  updateTheme: async (req, res) => res.json({}) // Stub
};
