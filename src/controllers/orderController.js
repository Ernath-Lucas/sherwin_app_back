const { Order, Product } = require('../models');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/apiResponse');

// @desc    Get user's orders
// @route   GET /api/orders
// @access  Private
const getMyOrders = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const orders = await Order.find({ user: req.user._id })
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Order.countDocuments({ user: req.user._id });

    return paginatedResponse(res, orders, page, limit, total, 'Orders retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return errorResponse(res, 'Order not found', 404);
    }

    // Check if user owns this order or is admin
    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return errorResponse(res, 'Not authorized to view this order', 403);
    }

    return successResponse(res, order);
  } catch (error) {
    next(error);
  }
};

// @desc    Create order
// @route   POST /api/orders
// @access  Private
const createOrder = async (req, res, next) => {
  try {
    const { items, notes } = req.body;

    if (!items || items.length === 0) {
      return errorResponse(res, 'No items in order', 400);
    }

    // Build order items with product details
    const orderItems = [];
    let total = 0;

    for (const item of items) {
      const product = await Product.findById(item.productId);
      
      if (!product) {
        return errorResponse(res, `Product not found: ${item.productId}`, 404);
      }

      if (!product.isActive) {
        return errorResponse(res, `Product is no longer available: ${product.reference}`, 400);
      }

      // Validate quantity against allowed quantities
      if (product.allowedQuantities && product.allowedQuantities.length > 0) {
        if (!product.allowedQuantities.includes(item.quantity)) {
          return errorResponse(res, 
            `Invalid quantity for ${product.reference}. Allowed quantities: ${product.allowedQuantities.join(', ')}`, 
            400
          );
        }
      }

      const subtotal = product.price * item.quantity;
      
      orderItems.push({
        product: product._id,
        reference: product.reference,
        name: product.nameEn,
        size: product.size,
        quantity: item.quantity,
        price: product.price,
        subtotal
      });

      total += subtotal;
    }

    const order = await Order.create({
      user: req.user._id,
      items: orderItems,
      total,
      notes
    });

    // Populate user for response
    await order.populate('user', 'name email');

    return successResponse(res, order, 'Order created successfully', 201);
  } catch (error) {
    next(error);
  }
};

// @desc    Update order item (remove item from order)
// @route   PUT /api/orders/:id/items/:itemIndex
// @access  Private (Admin or owner with pending status)
const removeOrderItem = async (req, res, next) => {
  try {
    const { id, itemIndex } = req.params;

    const order = await Order.findById(id);

    if (!order) {
      return errorResponse(res, 'Order not found', 404);
    }

    // Check authorization
    const isOwner = order.user._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return errorResponse(res, 'Not authorized to modify this order', 403);
    }

    // Only allow modification of pending orders (unless admin)
    if (!isAdmin && order.status !== 'pending') {
      return errorResponse(res, 'Cannot modify order that is not pending', 400);
    }

    const index = parseInt(itemIndex);
    if (index < 0 || index >= order.items.length) {
      return errorResponse(res, 'Invalid item index', 400);
    }

    // Remove item
    order.items.splice(index, 1);

    // If no items left, delete order
    if (order.items.length === 0) {
      await Order.findByIdAndDelete(id);
      return successResponse(res, null, 'Order deleted (no items remaining)');
    }

    // Recalculate total
    order.total = order.items.reduce((sum, item) => sum + item.subtotal, 0);
    await order.save();

    return successResponse(res, order, 'Item removed from order');
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel order
// @route   DELETE /api/orders/:id
// @access  Private (Admin or owner with pending status)
const cancelOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return errorResponse(res, 'Order not found', 404);
    }

    // Check authorization
    const isOwner = order.user._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return errorResponse(res, 'Not authorized to cancel this order', 403);
    }

    // Only allow cancellation of pending orders (unless admin)
    if (!isAdmin && order.status !== 'pending') {
      return errorResponse(res, 'Cannot cancel order that is not pending', 400);
    }

    order.status = 'cancelled';
    await order.save();

    return successResponse(res, order, 'Order cancelled');
  } catch (error) {
    next(error);
  }
};

// @desc    Get all orders (Admin)
// @route   GET /api/admin/orders
// @access  Admin
const getAllOrders = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const status = req.query.status;

    const query = {};
    if (status) {
      query.status = status;
    }

    const orders = await Order.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Order.countDocuments(query);

    return paginatedResponse(res, orders, page, limit, total, 'Orders retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Update order status (Admin)
// @route   PUT /api/admin/orders/:id/status
// @access  Admin
const updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return errorResponse(res, `Invalid status. Valid statuses: ${validStatuses.join(', ')}`, 400);
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return errorResponse(res, 'Order not found', 404);
    }

    order.status = status;
    await order.save();

    return successResponse(res, order, `Order status updated to ${status}`);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete order (Admin)
// @route   DELETE /api/admin/orders/:id
// @access  Admin
const deleteOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return errorResponse(res, 'Order not found', 404);
    }

    await Order.findByIdAndDelete(req.params.id);

    return successResponse(res, null, 'Order deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyOrders,
  getOrderById,
  createOrder,
  removeOrderItem,
  cancelOrder,
  getAllOrders,
  updateOrderStatus,
  deleteOrder
};
