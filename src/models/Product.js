const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  reference: {
    type: String,
    required: [true, 'Reference is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  nameEn: {
    type: String,
    required: [true, 'English name is required'],
    trim: true
  },
  nameFr: {
    type: String,
    required: [true, 'French name is required'],
    trim: true
  },
  size: {
    type: String,
    default: '1L'
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  color: {
    type: String,
    trim: true
  },
  allowedQuantities: {
    type: [Number],
    default: [1, 5, 10, 20]
  },
  relatedProducts: [{
    type: String,
    ref: 'Product'
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for search
productSchema.index({ reference: 'text', nameEn: 'text', nameFr: 'text' });

// Static method to search products
productSchema.statics.search = function(query) {
  const searchRegex = new RegExp(query, 'i');
  return this.find({
    isActive: true,
    $or: [
      { reference: searchRegex },
      { nameEn: searchRegex },
      { nameFr: searchRegex }
    ]
  });
};

module.exports = mongoose.model('Product', productSchema);
