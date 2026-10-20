const { query } = require('../../config/database');
const { flush } = require('../../services/cacheService');

const getOrCreate = async (key, type, defaultData) => {
  const { rows: existing } = await query('SELECT * FROM content WHERE key = $1 LIMIT 1', [key]);
  if (existing.length > 0) return existing[0];

  const { rows: created } = await query(
    'INSERT INTO content (key, type, data) VALUES ($1, $2, $3) RETURNING *',
    [key, type, JSON.stringify(defaultData)]
  );
  return created[0];
};

const getHero = async (req, res, next) => {
  try {
    const hero = await getOrCreate('hero', 'hero', {});
    res.json(hero);
  } catch (error) {
    next(error);
  }
};

const updateHero = async (req, res, next) => {
  try {
    const { rows } = await query(
      `INSERT INTO content (key, type, data, updated_at)
       VALUES ('hero', 'hero', $1, NOW())
       ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()
       RETURNING *`,
      [JSON.stringify(req.body)]
    );
    await flush('content:*');
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
};

const getNavbar = async (req, res, next) => {
  try {
    const nav = await getOrCreate('navbar', 'navbar', []);
    res.json(nav);
  } catch (error) {
    next(error);
  }
};

const updateNavbar = async (req, res, next) => {
  try {
    const items = req.body.items !== undefined ? req.body.items : req.body;
    const { rows } = await query(
      `INSERT INTO content (key, type, data, updated_at)
       VALUES ('navbar', 'navbar', $1, NOW())
       ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()
       RETURNING *`,
      [JSON.stringify(items)]
    );
    await flush('content:*');
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
};

const getFooter = async (req, res, next) => {
  try {
    const footer = await getOrCreate('footer', 'footer', []);
    res.json(footer);
  } catch (error) {
    next(error);
  }
};

const updateFooter = async (req, res, next) => {
  try {
    const groups = req.body.groups !== undefined ? req.body.groups : req.body;
    const { rows } = await query(
      `INSERT INTO content (key, type, data, updated_at)
       VALUES ('footer', 'footer', $1, NOW())
       ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()
       RETURNING *`,
      [JSON.stringify(groups)]
    );
    await flush('content:*');
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
};

const getHome = async (req, res, next) => {
  try {
    const home = await getOrCreate('home', 'home', {});
    res.json(home);
  } catch (error) {
    next(error);
  }
};

const updateHome = async (req, res, next) => {
  try {
    const { rows } = await query(
      `INSERT INTO content (key, type, data, updated_at)
       VALUES ('home', 'home', $1, NOW())
       ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()
       RETURNING *`,
      [JSON.stringify(req.body)]
    );
    await flush('content:*');
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
};

const getPages = async (req, res, next) => {
  try {
    const { rows } = await query(
      "SELECT * FROM content WHERE type = 'page' ORDER BY updated_at DESC"
    );
    res.json(
      (rows || []).map((page) => ({
        ...page,
        title: page.data?.title || page.key,
        slug: page.data?.slug || page.key,
        body: page.data?.body || '',
        isPublished: page.data?.isPublished ?? true,
        updatedAt: page.updated_at || page.created_at,
      }))
    );
  } catch (error) {
    next(error);
  }
};

const createPage = async (req, res, next) => {
  try {
    const { title, slug, body, isPublished } = req.body;
    const normalizedSlug = slug?.toString().trim().replace(/^\/+/, '');
    const dataObj = { title, slug: normalizedSlug, body, isPublished };

    const { rows } = await query(
      'INSERT INTO content (type, key, data) VALUES ($1, $2, $3) RETURNING *',
      ['page', normalizedSlug, JSON.stringify(dataObj)]
    );
    await flush('content:*');

    const created = rows[0];
    res.status(201).json({
      ...created,
      title,
      slug: normalizedSlug,
      body,
      isPublished,
      updatedAt: created.updated_at || created.created_at,
    });
  } catch (error) {
    next(error);
  }
};

const updatePage = async (req, res, next) => {
  try {
    const { title, slug, body, isPublished } = req.body;
    const normalizedSlug = slug?.toString().trim().replace(/^\/+/, '');
    const dataObj = { title, slug: normalizedSlug, body, isPublished };

    const { rows } = await query(
      'UPDATE content SET key = $1, data = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
      [normalizedSlug, JSON.stringify(dataObj), req.params.id]
    );

    if (!rows.length) {
      res.status(404);
      throw new Error('Page not found');
    }

    await flush('content:*');
    const updated = rows[0];
    res.json({
      ...updated,
      title,
      slug: normalizedSlug,
      body,
      isPublished,
      updatedAt: updated.updated_at || updated.created_at,
    });
  } catch (error) {
    next(error);
  }
};

const deletePage = async (req, res, next) => {
  try {
    await query('DELETE FROM content WHERE id = $1', [req.params.id]);
    await flush('content:*');
    res.json({ message: 'Page deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getHero,
  updateHero,
  getHome,
  updateHome,
  getNavbar,
  updateNavbar,
  getFooter,
  updateFooter,
  getPages,
  createPage,
  updatePage,
  deletePage,
};
