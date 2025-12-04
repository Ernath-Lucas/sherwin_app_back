const { Product } = require('../models');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/apiResponse');

// @desc    Get all products
// @route   GET /api/products
// @access  Private
const getProducts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const products = await Product.find({ isActive: true })
      .skip(skip)
      .limit(limit)
      .sort({ reference: 1 });

    const total = await Product.countDocuments({ isActive: true });

    return paginatedResponse(res, products, page, limit, total, 'Products retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Search products
// @route   GET /api/products/search
// @access  Private
const searchProducts = async (req, res, next) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length < 1) {
      return successResponse(res, [], 'No search query provided');
    }

    const products = await Product.search(q.trim());

    return successResponse(res, products, `Found ${products.length} products`);
  } catch (error) {
    next(error);
  }
};

// @desc    Get product by ID
// @route   GET /api/products/:id
// @access  Private
const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return errorResponse(res, 'Product not found', 404);
    }

    return successResponse(res, product);
  } catch (error) {
    next(error);
  }
};

// @desc    Get product by reference
// @route   GET /api/products/reference/:ref
// @access  Private
const getProductByReference = async (req, res, next) => {
  try {
    const product = await Product.findOne({ 
      reference: req.params.ref.toUpperCase(),
      isActive: true 
    });

    if (!product) {
      return errorResponse(res, 'Product not found', 404);
    }

    return successResponse(res, product);
  } catch (error) {
    next(error);
  }
};

// @desc    Get related products
// @route   GET /api/products/:id/related
// @access  Private
const getRelatedProducts = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return errorResponse(res, 'Product not found', 404);
    }

    if (!product.relatedProducts || product.relatedProducts.length === 0) {
      return successResponse(res, [], 'No related products');
    }

    const relatedProducts = await Product.find({
      reference: { $in: product.relatedProducts },
      isActive: true
    });

    return successResponse(res, relatedProducts);
  } catch (error) {
    next(error);
  }
};

// @desc    Create product
// @route   POST /api/admin/products
// @access  Admin
const createProduct = async (req, res, next) => {
  try {
    const { reference, nameEn, nameFr, price, size, color, allowedQuantities, relatedProducts } = req.body;

    // Check if product with this reference exists
    const existingProduct = await Product.findOne({ reference: reference.toUpperCase() });
    if (existingProduct) {
      return errorResponse(res, 'Product with this reference already exists', 400);
    }

    const product = await Product.create({
      reference: reference.toUpperCase(),
      nameEn,
      nameFr,
      price,
      size: size || '1L',
      color,
      allowedQuantities: allowedQuantities || [1, 5, 10, 20],
      relatedProducts: relatedProducts || []
    });

    return successResponse(res, product, 'Product created successfully', 201);
  } catch (error) {
    next(error);
  }
};

// @desc    Update product
// @route   PUT /api/admin/products/:id
// @access  Admin
const updateProduct = async (req, res, next) => {
  try {
    const { nameEn, nameFr, price, size, color, allowedQuantities, relatedProducts, isActive } = req.body;

    let product = await Product.findById(req.params.id);

    if (!product) {
      return errorResponse(res, 'Product not found', 404);
    }

    // Update fields
    if (nameEn) product.nameEn = nameEn;
    if (nameFr) product.nameFr = nameFr;
    if (price !== undefined) product.price = price;
    if (size) product.size = size;
    if (color !== undefined) product.color = color;
    if (allowedQuantities) product.allowedQuantities = allowedQuantities;
    if (relatedProducts) product.relatedProducts = relatedProducts;
    if (isActive !== undefined) product.isActive = isActive;

    await product.save();

    return successResponse(res, product, 'Product updated successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Update product by reference
// @route   PUT /api/admin/products/reference/:ref
// @access  Admin
const updateProductByReference = async (req, res, next) => {
  try {
    const { nameEn, nameFr, price, size, color, allowedQuantities, relatedProducts, isActive, newReference } = req.body;

    let product = await Product.findOne({ reference: req.params.ref.toUpperCase() });

    if (!product) {
      return errorResponse(res, 'Product not found', 404);
    }

    // Update fields
    if (nameEn) product.nameEn = nameEn;
    if (nameFr) product.nameFr = nameFr;
    if (price !== undefined) product.price = price;
    if (size) product.size = size;
    if (color !== undefined) product.color = color;
    if (allowedQuantities) product.allowedQuantities = allowedQuantities;
    if (relatedProducts) product.relatedProducts = relatedProducts;
    if (isActive !== undefined) product.isActive = isActive;
    if (newReference) product.reference = newReference.toUpperCase();

    await product.save();

    return successResponse(res, product, 'Product updated successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Delete product
// @route   DELETE /api/admin/products/:id
// @access  Admin
const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return errorResponse(res, 'Product not found', 404);
    }

    // Soft delete
    product.isActive = false;
    await product.save();

    return successResponse(res, null, 'Product deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProducts,
  searchProducts,
  getProductById,
  getProductByReference,
  getRelatedProducts,
  createProduct,
  updateProduct,
  updateProductByReference,
  deleteProduct
};
