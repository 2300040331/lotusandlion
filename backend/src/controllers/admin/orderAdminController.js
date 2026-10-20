const { query } = require('../../config/database');

const mapOrder = (o) => {
  if (!o) return null;
  return {
    ...o,
    _id: o.id,
    user: o.user_id,
    orderItems: o.order_items || [],
    shippingAddress: o.shipping_address || {},
    paymentMethod: o.payment_method,
    paymentResult: o.payment_result || {},
    taxPrice: Number(o.tax_price) || 0,
    shippingPrice: Number(o.shipping_price) || 0,
    totalPrice: Number(o.total_price) || 0,
    isPaid: Boolean(o.is_paid),
    paidAt: o.paid_at,
    isDelivered: Boolean(o.is_delivered),
    deliveredAt: o.delivered_at,
    status: o.status || 'Pending',
  };
};

// @route GET /api/admin/orders
const getAdminOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status = '' } = req.query;
    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.max(1, Number(limit));
    const offset = (pageNum - 1) * limitNum;

    const conditions = [];
    const params = [];
    let pIdx = 1;

    if (status) {
      conditions.push(`o.status = $${pIdx++}`);
      params.push(status);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await query(`SELECT COUNT(*) FROM orders o ${whereClause}`, params);
    const count = Number(countRes.rows[0]?.count || 0);

    params.push(limitNum);
    const limitParam = `$${pIdx++}`;
    params.push(offset);
    const offsetParam = `$${pIdx++}`;

    const sql = `
      SELECT o.*, json_build_object('name', p.name, 'email', p.email) AS profile
      FROM orders o
      LEFT JOIN profiles p ON p.id = o.user_id
      ${whereClause}
      ORDER BY o.created_at DESC
      LIMIT ${limitParam} OFFSET ${offsetParam}
    `;

    const { rows } = await query(sql, params);

    res.json({
      orders: rows.map(mapOrder),
      page: pageNum,
      pages: Math.ceil(count / limitNum),
      total: count,
    });
  } catch (error) {
    next(error);
  }
};

// @route GET /api/admin/orders/:id
const getAdminOrderById = async (req, res, next) => {
  try {
    const sql = `
      SELECT o.*, to_jsonb(p.*) AS profile
      FROM orders o
      LEFT JOIN profiles p ON p.id = o.user_id
      WHERE o.id = $1
      LIMIT 1
    `;

    const { rows } = await query(sql, [req.params.id]);
    if (!rows.length) {
      res.status(404);
      throw new Error('Order not found');
    }

    res.json(mapOrder(rows[0]));
  } catch (error) {
    next(error);
  }
};

// @route PUT /api/admin/orders/:id/status
const updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const { rows } = await query(
      'UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [status, req.params.id]
    );

    if (!rows.length) {
      res.status(404);
      throw new Error('Order not found');
    }

    res.json({
      message: `Order status updated to "${status}"`,
      order: mapOrder(rows[0]),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAdminOrders, getAdminOrderById, updateOrderStatus };
