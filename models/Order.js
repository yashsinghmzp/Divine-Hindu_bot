const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  order_id: { type: String, required: true, unique: true },
  customer_phone: { type: String },
  product: { type: String, required: true },
  status: { type: String, required: true },
  delivery: { type: String, required: true },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', orderSchema);