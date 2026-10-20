const { query } = require('../config/database');
const { flush } = require('../services/cacheService');

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
    taxPrice: o.tax_price || 0,
    shippingPrice: o.shipping_price || 0,
    totalPrice: o.total_price || 0,
    isPaid: Boolean(o.is_paid),
    paidAt: o.paid_at,
    isDelivered: Boolean(o.is_delivered),
    deliveredAt: o.delivered_at,
    status: o.status || 'Pending',
  };
};

// @desc    Create new order
// @route   POST /api/orders
const addOrderItems = async (req, res, next) => {
  try {
    const {
      orderItems,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      shippingPrice,
      totalPrice,
    } = req.body;

    if (!orderItems || orderItems.length === 0) {
      res.status(400);
      throw new Error('No order items');
    }

    // 1. Check stock
    for (const item of orderItems) {
      const { rows: prodRows } = await query(
        'SELECT id, name, stock_quantity, is_visible FROM products WHERE id = $1',
        [item.product]
      );
      const product = prodRows[0];

      if (!product || !product.is_visible) {
        res.status(404);
        throw new Error(`${item.name} is no longer available. Please remove it from your cart.`);
      }

      if (item.size || (item.color && item.color !== 'Default')) {
        let vSql = 'SELECT id, quantity FROM product_variants WHERE product_id = $1';
        const vParams = [item.product];
        let pIdx = 2;

        if (item.size) {
          vSql += ` AND size = $${pIdx++}`;
          vParams.push(item.size);
        }
        if (item.color) {
          vSql += ` AND color = $${pIdx++}`;
          vParams.push(item.color);
        }

        const { rows: varRows } = await query(vSql, vParams);
        const variant = varRows[0];
        const vQty = variant ? Number(variant.quantity) : 0;

        if (vQty <= 0) {
          res.status(400);
          throw new Error(`${product.name} is out of stock. Please remove it from your cart.`);
        }
        if (vQty < item.qty) {
          res.status(400);
          throw new Error(`Insufficient stock for ${product.name}. Available: ${vQty}`);
        }
      } else {
        if (product.stock_quantity <= 0) {
          res.status(400);
          throw new Error(`${product.name} is out of stock. Please remove it from your cart.`);
        }
        if (product.stock_quantity < item.qty) {
          res.status(400);
          throw new Error(`Insufficient stock for ${product.name}. Available: ${product.stock_quantity}`);
        }
      }
    }

    // 2. Create Order
    const { rows: orderRows } = await query(
      `INSERT INTO orders (
         user_id, order_items, shipping_address, payment_method,
         items_price, shipping_price, total_price, status
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        req.user.id,
        JSON.stringify(orderItems),
        JSON.stringify(shippingAddress),
        paymentMethod,
        Number(itemsPrice) || 0,
        Number(shippingPrice) || 0,
        Number(totalPrice) || 0,
        'pending',
      ]
    );

    const createdOrder = orderRows[0];

    // 3. Deduct stock
    for (const item of orderItems) {
      if (item.size || (item.color && item.color !== 'Default')) {
        let vUpdate = 'UPDATE product_variants SET quantity = GREATEST(0, quantity - $1) WHERE product_id = $2';
        const uParams = [item.qty, item.product];
        let uIdx = 3;
        if (item.size) {
          vUpdate += ` AND size = $${uIdx++}`;
          uParams.push(item.size);
        }
        if (item.color) {
          vUpdate += ` AND color = $${uIdx++}`;
          uParams.push(item.color);
        }
        await query(vUpdate, uParams);
      }

      await query(
        'UPDATE products SET stock_quantity = GREATEST(0, stock_quantity - $1) WHERE id = $2',
        [item.qty, item.product]
      );
    }

    await flush('products:*');
    res.status(201).json(mapOrder(createdOrder));
  } catch (error) {
    next(error);
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
const getOrderById = async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT o.*, json_build_object('name', pr.name, 'email', pr.email) AS profile
       FROM orders o
       LEFT JOIN profiles pr ON pr.id = o.user_id
       WHERE o.id = $1 LIMIT 1`,
      [req.params.id]
    );

    const order = rows[0];
    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }
    res.json(mapOrder(order));
  } catch (error) {
    next(error);
  }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
const getMyOrders = async (req, res, next) => {
  try {
    const { rows } = await query(
      'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(rows.map(mapOrder));
  } catch (error) {
    next(error);
  }
};

// @desc    Get all orders (Admin)
const getOrders = async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT o.*, json_build_object('id', pr.id, 'name', pr.name) AS profile
       FROM orders o
       LEFT JOIN profiles pr ON pr.id = o.user_id
       ORDER BY o.created_at DESC`
    );
    res.json(rows.map(mapOrder));
  } catch (error) {
    next(error);
  }
};

// @desc    Update order to paid
// @route   PUT /api/orders/:id/pay
const updateOrderToPaid = async (req, res, next) => {
  try {
    const { paymentId, signature } = req.body;
    const paymentResult = { id: paymentId, signature, status: 'success' };

    const { rows } = await query(
      `UPDATE orders
       SET is_paid = true,
           paid_at = NOW(),
           payment_result = $1,
           status = 'confirmed',
           updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [JSON.stringify(paymentResult), req.params.id]
    );

    if (!rows.length) {
      res.status(404);
      throw new Error('Order not found');
    }

    res.json(mapOrder(rows[0]));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addOrderItems,
  getOrderById,
  updateOrderToPaid,
  getMyOrders,
  getOrders,
};
