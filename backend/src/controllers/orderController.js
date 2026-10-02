const supabase = require('../config/supabase');
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
    taxPrice: o.tax_price,
    shippingPrice: o.shipping_price,
    totalPrice: o.total_price,
    isPaid: o.is_paid,
    paidAt: o.paid_at,
    isDelivered: o.is_delivered,
    deliveredAt: o.delivered_at,
    status: o.status || 'Pending'
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

    if (orderItems && orderItems.length === 0) {
      res.status(400);
      throw new Error('No order items');
    }

    // 1. Check stock
    for (const item of orderItems) {
      const { data: product, error: pError } = await supabase
        .from('products')
        .select('id, name, stock_quantity, is_visible')
        .eq('id', item.product)
        .single();
      
      if (pError || !product || !product.is_visible) {
        res.status(404);
        throw new Error(`${item.name} is no longer available. Please remove it from your cart.`);
      }
      
      // If variant has size or color, check variant stock
      if (item.size || (item.color && item.color !== 'Default')) {
        let vQuery = supabase
          .from('product_variants')
          .select('quantity')
          .eq('product_id', item.product);
        
        if (item.size) vQuery = vQuery.eq('size', item.size);
        if (item.color) {
          vQuery = vQuery.eq('color', item.color);
        } else {
          vQuery = vQuery.or('color.eq.Default,color.is.null');
        }
        
        const { data: variant } = await vQuery.maybeSingle();
        const vQty = variant ? Number(variant.quantity) : 0;
        
        if (vQty <= 0) {
          res.status(400);
          throw new Error(`${product.name} (${item.size || ''}${item.size && item.color ? ' / ' : ''}${item.color || ''}) is out of stock. Please remove it from your cart.`);
        }
        
        if (vQty < item.qty) {
          res.status(400);
          throw new Error(`Insufficient stock for ${product.name} (${item.size || ''}${item.size && item.color ? ' / ' : ''}${item.color || ''}). Available: ${vQty}`);
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
    const { data: createdOrder, error: oError } = await supabase
      .from('orders')
      .insert({
        user_id: req.user.id,
        order_items: orderItems,
        shipping_address: shippingAddress,
        payment_method: paymentMethod,
        items_price: Number(itemsPrice),
        shipping_price: Number(shippingPrice),
        total_price: Number(totalPrice),
        status: 'pending'
      })
      .select()
      .single();

    if (oError) throw oError;

    // 3. Deduct stock
    for (const item of orderItems) {
      const { data: p } = await supabase.from('products').select('stock_quantity').eq('id', item.product).single();
      
      // Deduct variant stock if size or color is present
      if (item.size || (item.color && item.color !== 'Default')) {
        let vQuery = supabase
          .from('product_variants')
          .select('id, quantity')
          .eq('product_id', item.product);
        
        if (item.size) vQuery = vQuery.eq('size', item.size);
        if (item.color) {
          vQuery = vQuery.eq('color', item.color);
        } else {
          vQuery = vQuery.or('color.eq.Default,color.is.null');
        }
        
        const { data: variant } = await vQuery.maybeSingle();
        if (variant) {
          await supabase
            .from('product_variants')
            .update({ quantity: Math.max(0, variant.quantity - item.qty) })
            .eq('id', variant.id);
        }
      }

      await supabase
        .from('products')
        .update({ stock_quantity: Math.max(0, p.stock_quantity - item.qty) })
        .eq('id', item.product);
    }

    await flush('products:*');
    res.status(201).json(mapOrder(createdOrder));
  } catch (error) { next(error); }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
const getOrderById = async (req, res, next) => {
  try {
    const { data: order, error } = await supabase
      .from('orders')
      .select('*, profile:profiles(name, email)')
      .eq('id', req.params.id)
      .single();

    if (error || !order) {
      res.status(404);
      throw new Error('Order not found');
    }
    res.json(mapOrder(order));
  } catch (error) { next(error); }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
const getMyOrders = async (req, res, next) => {
  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(orders.map(mapOrder));
  } catch (error) { next(error); }
};

// @desc    Get all orders (Admin)
const getOrders = async (req, res, next) => {
  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*, profile:profiles(id, name)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(orders.map(mapOrder));
  } catch (error) { next(error); }
};

module.exports = {
  addOrderItems,
  getOrderById,
  updateOrderToPaid: async (req, res) => res.status(501).json({ message: 'Payment update not yet implemented' }),
  getMyOrders,
  getOrders,
};
