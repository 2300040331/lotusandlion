const { query } = require('../../config/database');
const { flush } = require('../../services/cacheService');
const { uploadMultiple } = require('../../services/storageService');

const mapToCamelCase = (p) => {
  if (!p) return null;

  const images = (p.images?.map((img) => (typeof img === 'string' ? img : img.image_url)) || [p.image_url]).filter(Boolean);
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
    isPublished: Boolean(p.is_visible),
    flashSale: Boolean(p.is_flash_sale),
    releaseDate: p.release_date || null,
    image: mainImage,
    images: images,
    variants: p.variants || [],
    sizes: (p.variants || []).reduce(
      (acc, v) => {
        if (v.size) {
          acc[v.size] = (acc[v.size] || 0) + (Number(v.quantity) || 0);
        }
        return acc;
      },
      { XS: 0, S: 0, M: 0, L: 0, XL: 0, XXL: 0 }
    ),
  };
};

const slugify = (value = '') =>
  value
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const resolveCollectionId = async (idOrSlug) => {
  if (!idOrSlug) return null;
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug)) {
    return idOrSlug;
  }
  const { rows } = await query('SELECT id FROM collections WHERE LOWER(slug) = LOWER($1) LIMIT 1', [idOrSlug]);
  return rows[0]?.id || null;
};

// @route GET /api/admin/products
const getAdminProducts = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, search = '', sort = 'created_at' } = req.query;
    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.max(1, Number(limit));
    const offset = (pageNum - 1) * limitNum;

    const conditions = [];
    const params = [];
    let paramIdx = 1;

    if (search) {
      conditions.push(`p.name ILIKE $${paramIdx++}`);
      params.push(`%${search}%`);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await query(`SELECT COUNT(*) FROM products p ${whereClause}`, params);
    const count = Number(countRes.rows[0]?.count || 0);

    const orderField = sort.startsWith('-') ? sort.substring(1) : sort;
    const validSortFields = ['created_at', 'name', 'price', 'stock_quantity'];
    const safeOrderField = validSortFields.includes(orderField) ? orderField : 'created_at';
    const orderDirection = sort.startsWith('-') ? 'DESC' : 'ASC';

    params.push(limitNum);
    const limitParam = `$${paramIdx++}`;
    params.push(offset);
    const offsetParam = `$${paramIdx++}`;

    const sql = `
      SELECT p.*,
             json_build_object('name', c.name) AS collection,
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
      LEFT JOIN collections c ON c.id = p.collection_id
      ${whereClause}
      ORDER BY p.${safeOrderField} ${orderDirection}
      LIMIT ${limitParam} OFFSET ${offsetParam}
    `;

    const { rows } = await query(sql, params);

    res.json({
      products: rows.map(mapToCamelCase),
      page: pageNum,
      pages: Math.ceil(count / limitNum),
      total: count,
    });
  } catch (error) {
    next(error);
  }
};

// @route GET /api/admin/products/:id
const getAdminProductById = async (req, res, next) => {
  try {
    const sql = `
      SELECT p.*,
             to_jsonb(c.*) AS collection,
             COALESCE(
               (SELECT json_agg(pi.* ORDER BY pi.is_main DESC, pi.display_order ASC)
                FROM product_images pi WHERE pi.product_id = p.id),
               '[]'::json
             ) AS images,
             COALESCE(
               (SELECT json_agg(pv.*) FROM product_variants pv WHERE pv.product_id = p.id),
               '[]'::json
             ) AS variants
      FROM products p
      LEFT JOIN collections c ON c.id = p.collection_id
      WHERE p.id = $1
      LIMIT 1
    `;

    const { rows } = await query(sql, [req.params.id]);
    if (!rows.length) {
      res.status(404);
      throw new Error('Product not found');
    }
    res.json(mapToCamelCase(rows[0]));
  } catch (error) {
    next(error);
  }
};

// @route POST /api/admin/products
const createProduct = async (req, res, next) => {
  try {
    const {
      name,
      slug,
      description,
      richDescription,
      price,
      category,
      collectionType,
      countInStock,
      isFeatured,
      isVisible,
      releaseDate,
      discountPrice,
      images,
      sizes,
    } = req.body;

    const resolvedCollectionId = await resolveCollectionId(collectionType);
    let productSlug = slugify(slug || name || `product-${Date.now()}`);

    const { rows: slugCheck } = await query('SELECT id FROM products WHERE slug = $1 LIMIT 1', [productSlug]);
    if (slugCheck.length > 0) {
      productSlug = `${productSlug}-${Math.random().toString(36).substring(2, 6)}`;
    }

    const insertSql = `
      INSERT INTO products (
        name, slug, description, rich_description, price, discount_price,
        category, collection_id, stock_quantity, is_featured, is_visible, release_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;

    const { rows } = await query(insertSql, [
      name,
      productSlug,
      description || null,
      richDescription || null,
      !isNaN(Number(price)) ? Number(price) : 0,
      !isNaN(Number(discountPrice)) ? Number(discountPrice) : null,
      category || null,
      resolvedCollectionId,
      !isNaN(Number(countInStock)) ? Number(countInStock) : 0,
      isFeatured === true || isFeatured === 'true',
      isVisible !== false && isVisible !== 'false',
      releaseDate || new Date().toISOString(),
    ]);

    const product = rows[0];

    // Handle files if uploaded
    if (req.files && req.files.length > 0) {
      const uploadResults = await uploadMultiple(req.files, `products/${product.id}`);
      for (let i = 0; i < uploadResults.length; i++) {
        await query(
          'INSERT INTO product_images (product_id, image_url, is_main, display_order) VALUES ($1, $2, $3, $4)',
          [product.id, uploadResults[i].url, i === 0, i]
        );
      }
    } else if (images && Array.isArray(images) && images.length > 0) {
      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        const url = typeof img === 'string' ? img : img.image_url || img.url;
        if (url) {
          await query(
            'INSERT INTO product_images (product_id, image_url, is_main, display_order) VALUES ($1, $2, $3, $4)',
            [product.id, url, i === 0, i]
          );
        }
      }
    }

    // Handle variants / sizes
    if (req.body.variants && Array.isArray(req.body.variants)) {
      for (const v of req.body.variants) {
        if (Number(v.quantity) > 0) {
          await query(
            'INSERT INTO product_variants (product_id, size, quantity, color) VALUES ($1, $2, $3, $4)',
            [product.id, v.size, Number(v.quantity), v.color || 'Default']
          );
        }
      }
    } else if (sizes && typeof sizes === 'object') {
      for (const [size, qty] of Object.entries(sizes)) {
        if (Number(qty) > 0) {
          await query(
            'INSERT INTO product_variants (product_id, size, quantity, color) VALUES ($1, $2, $3, $4)',
            [product.id, size, Number(qty), 'Default']
          );
        }
      }
    }

    await flush('products:*');
    await flush('content:site');

    // Refetch full product
    const refetchSql = `
      SELECT p.*,
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
      WHERE p.id = $1
    `;
    const fullRes = await query(refetchSql, [product.id]);

    res.status(201).json(mapToCamelCase(fullRes.rows[0] || product));
  } catch (error) {
    next(error);
  }
};

// @route PUT /api/admin/products/:id
const updateProduct = async (req, res, next) => {
  try {
    const {
      name,
      description,
      richDescription,
      price,
      category,
      collectionType,
      countInStock,
      isFeatured,
      isVisible,
      releaseDate,
      discountPrice,
      images,
      sizes,
    } = req.body;

    const resolvedCollectionId = await resolveCollectionId(collectionType);

    const updateFields = [];
    const params = [];
    let pIdx = 1;

    if (name !== undefined) {
      updateFields.push(`name = $${pIdx++}`);
      params.push(name);
    }
    if (description !== undefined) {
      updateFields.push(`description = $${pIdx++}`);
      params.push(description);
    }
    if (richDescription !== undefined) {
      updateFields.push(`rich_description = $${pIdx++}`);
      params.push(richDescription);
    }
    if (price !== undefined && !isNaN(Number(price))) {
      updateFields.push(`price = $${pIdx++}`);
      params.push(Number(price));
    }
    if (discountPrice !== undefined) {
      updateFields.push(`discount_price = $${pIdx++}`);
      params.push(!isNaN(Number(discountPrice)) ? Number(discountPrice) : null);
    }
    if (category !== undefined) {
      updateFields.push(`category = $${pIdx++}`);
      params.push(category);
    }
    if (resolvedCollectionId !== null && resolvedCollectionId !== undefined) {
      updateFields.push(`collection_id = $${pIdx++}`);
      params.push(resolvedCollectionId);
    }
    if (countInStock !== undefined && !isNaN(Number(countInStock))) {
      updateFields.push(`stock_quantity = $${pIdx++}`);
      params.push(Number(countInStock));
    }
    if (isFeatured !== undefined) {
      updateFields.push(`is_featured = $${pIdx++}`);
      params.push(isFeatured === true || isFeatured === 'true');
    }
    if (isVisible !== undefined) {
      updateFields.push(`is_visible = $${pIdx++}`);
      params.push(isVisible !== false && isVisible !== 'false');
    }
    if (releaseDate !== undefined) {
      updateFields.push(`release_date = $${pIdx++}`);
      params.push(releaseDate);
    }

    if (updateFields.length > 0) {
      params.push(req.params.id);
      const updateSql = `UPDATE products SET ${updateFields.join(', ')} WHERE id = $${pIdx} RETURNING *`;
      await query(updateSql, params);
    }

    // Sync images if provided
    if (images && Array.isArray(images)) {
      await query('DELETE FROM product_images WHERE product_id = $1', [req.params.id]);
      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        const url = typeof img === 'string' ? img : img.image_url || img.url;
        if (url) {
          await query(
            'INSERT INTO product_images (product_id, image_url, is_main, display_order) VALUES ($1, $2, $3, $4)',
            [req.params.id, url, i === 0, i]
          );
        }
      }
    }

    // Sync variants / sizes
    if (req.body.variants && Array.isArray(req.body.variants)) {
      await query('DELETE FROM product_variants WHERE product_id = $1', [req.params.id]);
      for (const v of req.body.variants) {
        if (Number(v.quantity) > 0) {
          await query(
            'INSERT INTO product_variants (product_id, size, quantity, color) VALUES ($1, $2, $3, $4)',
            [req.params.id, v.size, Number(v.quantity), v.color || 'Default']
          );
        }
      }
    } else if (sizes && typeof sizes === 'object') {
      await query('DELETE FROM product_variants WHERE product_id = $1', [req.params.id]);
      for (const [size, qty] of Object.entries(sizes)) {
        if (Number(qty) > 0) {
          await query(
            'INSERT INTO product_variants (product_id, size, quantity, color) VALUES ($1, $2, $3, $4)',
            [req.params.id, size, Number(qty), 'Default']
          );
        }
      }
    }

    await flush('products:*');
    await flush('content:site');

    // Refetch full product
    const refetchSql = `
      SELECT p.*,
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
      WHERE p.id = $1
    `;
    const fullRes = await query(refetchSql, [req.params.id]);

    res.json(mapToCamelCase(fullRes.rows[0]));
  } catch (error) {
    next(error);
  }
};

// @route DELETE /api/admin/products/:id
const deleteProduct = async (req, res, next) => {
  try {
    await query('DELETE FROM product_images WHERE product_id = $1', [req.params.id]);
    await query('DELETE FROM product_variants WHERE product_id = $1', [req.params.id]);
    await query('DELETE FROM products WHERE id = $1', [req.params.id]);

    await flush('products:*');
    await flush('content:site');
    res.json({ message: 'Product removed' });
  } catch (error) {
    next(error);
  }
};

// @route PATCH /api/admin/products/:id/featured
const toggleFeatured = async (req, res, next) => {
  try {
    const { rows } = await query(
      'UPDATE products SET is_featured = NOT is_featured WHERE id = $1 RETURNING *',
      [req.params.id]
    );
    if (!rows.length) {
      res.status(404);
      throw new Error('Product not found');
    }
    await flush('products:*');
    await flush('content:site');
    res.json(mapToCamelCase(rows[0]));
  } catch (error) {
    next(error);
  }
};

// @route PATCH /api/admin/products/:id/visibility
const toggleVisibility = async (req, res, next) => {
  try {
    const { rows } = await query(
      'UPDATE products SET is_visible = NOT is_visible WHERE id = $1 RETURNING *',
      [req.params.id]
    );
    if (!rows.length) {
      res.status(404);
      throw new Error('Product not found');
    }
    await flush('products:*');
    await flush('content:site');
    res.json(mapToCamelCase(rows[0]));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAdminProducts,
  getAdminProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  toggleFeatured,
  toggleVisibility,
  applyBulkDiscount: async (req, res) => res.status(501).json({ message: 'Not implemented' }),
};
