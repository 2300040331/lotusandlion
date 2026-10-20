const { query } = require('../../config/database');
const { remember } = require('../../services/cacheService');

const getDashboardStats = async (req, res, next) => {
  try {
    const stats = await remember('admin:dashboard:stats', async () => {
      const [
        ordersCountRes,
        usersCountRes,
        productsCountRes,
        allOrdersRes,
        recentOrdersRes,
        topProductsRes,
        lowStockRes,
      ] = await Promise.all([
        query('SELECT COUNT(*) FROM orders'),
        query('SELECT COUNT(*) FROM profiles'),
        query('SELECT COUNT(*) FROM products'),
        query('SELECT total_price, created_at, status, is_paid FROM orders ORDER BY created_at DESC LIMIT 100'),
        query(`
          SELECT o.*, json_build_object('name', p.name, 'email', p.email) AS user
          FROM orders o
          LEFT JOIN profiles p ON p.id = o.user_id
          ORDER BY o.created_at DESC
          LIMIT 10
        `),
        query(`
          SELECT p.*,
                 COALESCE(
                   (SELECT json_agg(json_build_object('image_url', pi.image_url)) FROM product_images pi WHERE pi.product_id = p.id),
                   '[]'::json
                 ) AS images
          FROM products p
          ORDER BY p.stock_quantity DESC
          LIMIT 5
        `),
        query(`
          SELECT p.*,
                 COALESCE(
                   (SELECT json_agg(json_build_object('image_url', pi.image_url)) FROM product_images pi WHERE pi.product_id = p.id),
                   '[]'::json
                 ) AS images
          FROM products p
          WHERE p.stock_quantity > 0 AND p.stock_quantity < 10
          LIMIT 5
        `),
      ]);

      const totalOrders = Number(ordersCountRes.rows[0]?.count || 0);
      const totalUsers = Number(usersCountRes.rows[0]?.count || 0);
      const totalProducts = Number(productsCountRes.rows[0]?.count || 0);
      const allOrders = allOrdersRes.rows || [];

      const totalRevenue = allOrders.reduce((acc, o) => {
        const isPaid = (o.status && o.status.toLowerCase() === 'paid') || o.is_paid;
        return acc + (isPaid ? Number(o.total_price || 0) : 0);
      }, 0);

      const mapProduct = (p) => ({
        id: p.id,
        name: p.name,
        price: Number(p.price) || 0,
        countInStock: Number(p.stock_quantity) || 0,
        category: p.category,
        image: p.images?.[0]?.image_url || p.image_url || null,
      });

      return {
        totalRevenue,
        totalOrders,
        totalUsers,
        totalProducts,
        recentOrders: (recentOrdersRes.rows || []).map((o) => ({
          id: o.id,
          totalPrice: Number(o.total_price) || 0,
          status: o.status,
          isPaid: Boolean(o.is_paid),
          isDelivered: Boolean(o.is_delivered),
          user: o.user,
        })),
        topSellingProducts: (topProductsRes.rows || []).map(mapProduct),
        lowStockProducts: (lowStockRes.rows || []).map(mapProduct),
        revenueChart: allOrders.slice(0, 7).map((o) => ({
          date: new Date(o.created_at).toLocaleDateString(),
          revenue: Number(o.total_price) || 0,
        })),
      };
    }, 60);

    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
    res.json(stats);
  } catch (error) {
    console.error('[Dashboard Error]', error);
    res.status(500).json({
      totalRevenue: 0,
      totalOrders: 0,
      totalUsers: 0,
      totalProducts: 0,
      recentOrders: [],
      topSellingProducts: [],
      lowStockProducts: [],
      revenueChart: [],
      error: error.message,
    });
  }
};

module.exports = { getDashboardStats };
