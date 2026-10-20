const { query } = require('../../config/database');
const { flush } = require('../../services/cacheService');

const slugify = (value = '') =>
  value
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const listCollections = async (req, res, next) => {
  try {
    const { rows } = await query('SELECT * FROM collections ORDER BY display_order ASC, created_at ASC');
    const formatted = (rows || []).map((c) => {
      c.categories = c.hero?.categories || [];
      c.dropSchedules = c.hero?.dropSchedules || [];
      return c;
    });
    res.json(formatted);
  } catch (error) {
    next(error);
  }
};

const getCollection = async (req, res, next) => {
  try {
    const { rows: collRows } = await query('SELECT * FROM collections WHERE slug = $1 LIMIT 1', [req.params.key]);
    const collection = collRows[0];
    if (!collection) {
      res.status(404);
      throw new Error('Collection not found');
    }

    collection.categories = collection.hero?.categories || [];
    collection.dropSchedules = collection.hero?.dropSchedules || [];

    const { rows: products } = await query('SELECT * FROM products WHERE collection_id = $1 LIMIT 50', [collection.id]);
    res.json({ collection, products });
  } catch (error) {
    next(error);
  }
};

const updateCollection = async (req, res, next) => {
  try {
    const collectionSlug = req.params.key;
    const payload = { ...req.body };

    payload.hero = payload.hero || {};
    if (payload.categories !== undefined) {
      payload.hero.categories = payload.categories;
    }
    if (payload.dropSchedules !== undefined) {
      payload.hero.dropSchedules = payload.dropSchedules;
    }

    const updateFields = [];
    const params = [];
    let pIdx = 1;

    if (payload.name !== undefined) {
      updateFields.push(`name = $${pIdx++}`);
      params.push(payload.name);
    }
    if (payload.description !== undefined) {
      updateFields.push(`description = $${pIdx++}`);
      params.push(payload.description);
    }
    if (payload.banner_url !== undefined) {
      updateFields.push(`banner_url = $${pIdx++}`);
      params.push(payload.banner_url);
    }
    if (payload.is_active !== undefined) {
      updateFields.push(`is_active = $${pIdx++}`);
      params.push(Boolean(payload.is_active));
    }
    if (payload.display_order !== undefined) {
      updateFields.push(`display_order = $${pIdx++}`);
      params.push(Number(payload.display_order) || 0);
    }
    if (payload.hero !== undefined) {
      updateFields.push(`hero = $${pIdx++}`);
      params.push(JSON.stringify(payload.hero));
    }

    if (!updateFields.length) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    params.push(collectionSlug);
    const sql = `UPDATE collections SET ${updateFields.join(', ')} WHERE slug = $${pIdx} RETURNING *`;
    const { rows } = await query(sql, params);

    const data = rows[0];
    if (data) {
      data.categories = data.hero?.categories || [];
      data.dropSchedules = data.hero?.dropSchedules || [];
    }

    await flush(`collection:${collectionSlug}:*`);
    await flush('collections:*');
    await flush('products:list:*');
    await flush('content:site');

    res.json(data);
  } catch (error) {
    next(error);
  }
};

const upsertCollection = async (req, res, next) => {
  try {
    const payload = { ...req.body };
    payload.slug = slugify(payload.slug || payload.name || payload.title);

    payload.hero = payload.hero || {};
    if (payload.categories !== undefined) {
      payload.hero.categories = payload.categories;
    }
    if (payload.dropSchedules !== undefined) {
      payload.hero.dropSchedules = payload.dropSchedules;
    }

    let result;
    const id = payload.id || payload._id;

    if (id) {
      const sql = `
        UPDATE collections
        SET name = $1, slug = $2, description = $3, banner_url = $4,
            is_active = $5, display_order = $6, hero = $7
        WHERE id = $8
        RETURNING *
      `;
      const { rows } = await query(sql, [
        payload.name,
        payload.slug,
        payload.description || '',
        payload.banner_url || '',
        payload.is_active !== false,
        Number(payload.display_order) || 0,
        JSON.stringify(payload.hero),
        id,
      ]);
      result = rows[0];
    } else {
      const sql = `
        INSERT INTO collections (name, slug, description, banner_url, is_active, display_order, hero)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;
      const { rows } = await query(sql, [
        payload.name,
        payload.slug,
        payload.description || '',
        payload.banner_url || '',
        payload.is_active !== false,
        Number(payload.display_order) || 0,
        JSON.stringify(payload.hero),
      ]);
      result = rows[0];
    }

    if (result) {
      result.categories = result.hero?.categories || [];
      result.dropSchedules = result.hero?.dropSchedules || [];
    }

    await flush(`collection:${result?.slug}:*`);
    await flush('collections:*');
    await flush('content:site');
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const deleteCollection = async (req, res, next) => {
  try {
    await query('DELETE FROM collections WHERE id = $1', [req.params.id]);
    await flush('collections:*');
    await flush('content:site');
    res.json({ message: 'Collection deleted' });
  } catch (error) {
    next(error);
  }
};

const listSections = async (req, res, next) => {
  try {
    const { rows } = await query('SELECT * FROM homepage_sections ORDER BY display_order ASC');
    res.json(rows);
  } catch (error) {
    next(error);
  }
};

const upsertSection = async (req, res, next) => {
  try {
    const payload = { ...req.body };
    let result;
    const id = payload.id || payload._id || req.params.id;

    if (id) {
      const sql = `
        UPDATE homepage_sections
        SET section_key = COALESCE($1, section_key),
            title = COALESCE($2, title),
            content = COALESCE($3, content),
            display_order = COALESCE($4, display_order),
            is_active = COALESCE($5, is_active)
        WHERE id = $6
        RETURNING *
      `;
      const { rows } = await query(sql, [
        payload.section_key,
        payload.title,
        payload.content ? JSON.stringify(payload.content) : null,
        payload.display_order !== undefined ? Number(payload.display_order) : null,
        payload.is_active !== undefined ? Boolean(payload.is_active) : null,
        id,
      ]);
      result = rows[0];
    } else {
      const sql = `
        INSERT INTO homepage_sections (section_key, title, content, display_order, is_active)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;
      const { rows } = await query(sql, [
        payload.section_key || `section-${Date.now()}`,
        payload.title || '',
        JSON.stringify(payload.content || {}),
        Number(payload.display_order) || 0,
        payload.is_active !== false,
      ]);
      result = rows[0];
    }

    await flush('content:*');
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const deleteSection = async (req, res, next) => {
  try {
    await query('DELETE FROM homepage_sections WHERE id = $1', [req.params.id]);
    await flush('content:*');
    res.json({ message: 'Section deleted' });
  } catch (error) {
    next(error);
  }
};

const listAnnouncements = async (req, res, next) => {
  try {
    const { rows } = await query('SELECT * FROM announcements ORDER BY created_at DESC LIMIT 20');
    res.json(rows);
  } catch (error) {
    next(error);
  }
};

const upsertAnnouncement = async (req, res, next) => {
  try {
    const { id, message, placement, is_active } = req.body;
    const targetId = id || req.params.id;
    let result;

    if (targetId) {
      const { rows } = await query(
        'UPDATE announcements SET message = $1, placement = $2, is_active = $3 WHERE id = $4 RETURNING *',
        [message, placement || 'top', is_active !== false, targetId]
      );
      result = rows[0];
    } else {
      const { rows } = await query(
        'INSERT INTO announcements (message, placement, is_active) VALUES ($1, $2, $3) RETURNING *',
        [message, placement || 'top', is_active !== false]
      );
      result = rows[0];
    }

    await flush('content:*');
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const getControlCenter = async (req, res, next) => {
  try {
    const [collRes, secRes, annRes, prodRes] = await Promise.all([
      query('SELECT * FROM collections ORDER BY display_order ASC'),
      query('SELECT * FROM homepage_sections ORDER BY display_order ASC'),
      query('SELECT * FROM announcements ORDER BY created_at DESC LIMIT 10'),
      query('SELECT id, name FROM products LIMIT 50'),
    ]);

    res.json({
      modules: ['Homepage Builder', 'Products', 'Collections', 'Sections', 'Announcements'],
      collections: collRes.rows || [],
      sections: secRes.rows || [],
      announcements: annRes.rows || [],
      products: prodRes.rows || [],
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listCollections,
  getCollection,
  updateCollection,
  upsertCollection,
  deleteCollection,
  listSections,
  upsertSection,
  deleteSection,
  listAnnouncements,
  upsertAnnouncement,
  getControlCenter,
  getTheme: async (req, res) => res.json({}),
  updateTheme: async (req, res) => res.json({}),
};
