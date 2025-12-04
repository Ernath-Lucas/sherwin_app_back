const express = require('express');
const router = express.Router();
const { 
  getMyOrders, 
  getOrderById, 
  createOrder, 
  removeOrderItem,
  cancelOrder 
} = require('../controllers/orderController');
const { protect } = require('../middleware/auth');
const { orderValidation, idParamValidation } = require('../middleware/validation');

// All routes require authentication
router.use(protect);

// Order routes
router.get('/', getMyOrders);
router.post('/', orderValidation, createOrder);
router.get('/:id', idParamValidation, getOrderById);
router.put('/:id/items/:itemIndex', idParamValidation, removeOrderItem);
router.delete('/:id', idParamValidation, cancelOrder);

module.exports = router;
