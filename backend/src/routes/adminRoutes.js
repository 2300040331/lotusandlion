const express = require('express');
const router = express.Router();
const { protect, admin, superAdmin } = require('../middleware/authMiddleware');
const { authUser } = require('../controllers/authController');
const { upload, uploadFields, handleSingleUpload, handleMultipleUpload } = require('../controllers/admin/uploadController');

// Controllers
const { getDashboardStats } = require('../controllers/admin/dashboardController');
const {
  getAdminProducts,
  getAdminProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  toggleFeatured,
  toggleVisibility,
  applyBulkDiscount,
} = require('../controllers/admin/productAdminController');
const { getAdminOrders, getAdminOrderById, updateOrderStatus } = require('../controllers/admin/orderAdminController');
const { getAdminUsers, getAdminUserById, getUserOrders, updateAdminUser, deleteAdminUser } = require('../controllers/admin/userAdminController');
const {
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
} = require('../controllers/admin/contentController');
const { getSettings, updateSetting, updateSettings } = require('../controllers/admin/settingsController');
const {
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
  getTheme,
  updateTheme,
  getControlCenter,
} = require('../controllers/admin/superCmsController');

// ─── Dashboard ───────────────────────────────────────────────────────────────
router.post('/login', authUser);
router.get('/dashboard', protect, admin, getDashboardStats);
router.get('/control-center', protect, admin, getControlCenter);

// ─── Products ────────────────────────────────────────────────────────────────
router.get('/products', protect, admin, getAdminProducts);
router.get('/products/:id', protect, admin, getAdminProductById);
router.post('/products', protect, admin, createProduct);
router.put('/products/:id', protect, admin, updateProduct);
router.delete('/products/:id', protect, admin, deleteProduct);
router.patch('/products/:id/featured', protect, admin, toggleFeatured);
router.patch('/products/:id/visibility', protect, admin, toggleVisibility);
router.post('/products/bulk-discount', protect, superAdmin, applyBulkDiscount);

router.get('/collections', protect, admin, listCollections);
router.post('/collections', protect, admin, upsertCollection);
router.get('/collections/:key', protect, admin, getCollection);
router.put('/collections/:key', protect, admin, updateCollection);
router.delete('/collections/:id', protect, superAdmin, deleteCollection);

router.get('/homepage/sections', protect, admin, listSections);
router.post('/homepage/sections', protect, admin, upsertSection);
router.put('/homepage/sections/:id', protect, admin, upsertSection);
router.delete('/homepage/sections/:id', protect, superAdmin, deleteSection);

router.get('/announcements', protect, admin, listAnnouncements);
router.post('/announcements', protect, admin, upsertAnnouncement);
router.put('/announcements/:id', protect, admin, upsertAnnouncement);
router.get('/theme', protect, admin, getTheme);
router.put('/theme', protect, superAdmin, updateTheme);

// ─── Orders ──────────────────────────────────────────────────────────────────
router.get('/orders', protect, admin, getAdminOrders);
router.get('/orders/:id', protect, admin, getAdminOrderById);
router.put('/orders/:id/status', protect, admin, updateOrderStatus);

// ─── Users ───────────────────────────────────────────────────────────────────
router.get('/users', protect, admin, getAdminUsers);
router.get('/users/:id', protect, admin, getAdminUserById);
router.get('/users/:id/orders', protect, admin, getUserOrders);
router.put('/users/:id', protect, superAdmin, updateAdminUser);
router.delete('/users/:id', protect, superAdmin, deleteAdminUser);

// ─── Content (CMS) ────────────────────────────────────────────────────────────
router.get('/content/hero', getHero);
router.put('/content/hero', protect, admin, updateHero);
router.get('/content/home', getHome);
router.put('/content/home', protect, admin, updateHome);
router.get('/content/navbar', getNavbar);
router.put('/content/navbar', protect, admin, updateNavbar);
router.get('/content/footer', getFooter);
router.put('/content/footer', protect, admin, updateFooter);
router.get('/content/pages', getPages);
router.post('/content/pages', protect, admin, createPage);
router.put('/content/pages/:id', protect, admin, updatePage);
router.delete('/content/pages/:id', protect, admin, deletePage);

// ─── Settings ────────────────────────────────────────────────────────────────
router.get('/settings', protect, admin, getSettings);
router.put('/settings', protect, superAdmin, updateSettings);
router.put('/settings/:key', protect, superAdmin, updateSetting);

// ─── Uploads ─────────────────────────────────────────────────────────────────
router.post('/upload/single', protect, admin, upload.single('image'), handleSingleUpload);
router.post('/upload/multiple', protect, admin, upload.array('images', 10), handleMultipleUpload);

module.exports = router;
