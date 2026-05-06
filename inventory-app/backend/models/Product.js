const mongoose = require('mongoose'); // 1. ADD THIS LINE

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  sku: { type: String, required: true, unique: true },
  barcode: { type: String, trim: true, default: '' },
  currentStock: { type: Number, required: true, default: 0 },
  minStockLevel: { type: Number, default: 10 },
  costPrice: { type: Number, default: 0, min: 0 },
  // Store the last 5 days of sales here
  salesHistory: { 
    type: [Number], 
    default: [0, 0, 0, 0, 0],
    validate: [val => (val ? val.length <= 5 : true), 'History exceeds 5 days'] 
  },
  price: { type: Number, required: true },
  category: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

ProductSchema.index(
  { user: 1, barcode: 1 },
  {
    unique: true,
    partialFilterExpression: { barcode: { $type: 'string', $ne: '' } }
  }
);

// 2. ADD THIS LINE TO EXPORT THE MODEL
module.exports = mongoose.model('Product', ProductSchema);