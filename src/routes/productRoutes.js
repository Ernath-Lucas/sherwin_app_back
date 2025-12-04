const express = require('express');
const router = express.Router();
const { 
  getProducts, 
  searchProducts, 
  getProductById, 
  getProductByReference,
  getRelatedProducts 
} = require('../controllers/productController');
const { protect } = require('../middleware/auth');
const { idParamValidation } = require('../middleware/validation');

// All routes require authentication
router.use(protect);

// Product routes
router.get('/', getProducts);
router.get('/search', searchProducts);
router.get('/reference/:ref', getProductByReference);
router.get('/:id', idParamValidation, getProductById);
router.get('/:id/related', idParamValidation, getRelatedProducts);

module.exports = router;
