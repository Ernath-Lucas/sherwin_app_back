const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const { 
  productValidation, 
  productUpdateValidation, 
  passwordResetValidation,
  idParamValidation 
} = require('../middleware/validation');

// Controllers
const {
  getUsers,
  getUserById,
  deleteUser,
  deleteUserByEmail,
  getPasswordResetRequests,
  processPasswordReset,
  rejectPasswordReset
} = require('../controllers/userController');

const {
  createProduct,
  updateProduct,
  updateProductByReference,
  deleteProduct,
  getProducts
} = require('../controllers/productController');

const {
  getAllOrders,
  updateOrderStatus,
  deleteOrder,
  removeOrderItem
} = require('../controllers/orderController');

// All admin routes require authentication and admin role
router.use(protect);
router.use(adminOnly);

// ==================== USER ROUTES ====================
router.get('/users', getUsers);
router.get('/users/password-requests', getPasswordResetRequests);
router.get('/users/:id', idParamValidation, getUserById);
router.delete('/users/:id', idParamValidation, deleteUser);
router.delete('/users/by-email', deleteUserByEmail);
router.put('/users/password-requests/:id', idParamValidation, passwordResetValidation, processPasswordReset);
router.delete('/users/password-requests/:id', idParamValidation, rejectPasswordReset);

// ==================== PRODUCT ROUTES ====================
router.get('/products', getProducts);
router.post('/products', productValidation, createProduct);
router.put('/products/:id', idParamValidation, productUpdateValidation, updateProduct);
router.put('/products/reference/:ref', productUpdateValidation, updateProductByReference);
router.delete('/products/:id', idParamValidation, deleteProduct);

// ==================== ORDER ROUTES ====================
router.get('/orders', getAllOrders);
router.put('/orders/:id/status', idParamValidation, updateOrderStatus);
router.put('/orders/:id/items/:itemIndex', removeOrderItem);
router.delete('/orders/:id', idParamValidation, deleteOrder);

module.exports = router;
