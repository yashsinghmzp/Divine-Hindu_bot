const mongoose = require('mongoose');
const Order = require('./models/Order');
require('dotenv').config();

const orders = [
  { order_id: 'ORD001', customer_phone: '+916393315685', product: 'Rudraksha Mala', status: 'Out for Delivery', delivery: 'Today by 7 PM' },
  { order_id: 'ORD002', customer_phone: '+916393315685', product: 'Brass Diya Set', status: 'Shipped', delivery: 'Tomorrow by 2 PM' },
  { order_id: 'ORD003', customer_phone: '+916393315685', product: 'Ganesh Idol', status: 'Processing', delivery: 'In 2-3 days' },
  { order_id: 'ORD004', customer_phone: '+916393315685', product: 'Shiva Linga', status: 'Delivered', delivery: 'Delivered on 5th April' },
  { order_id: 'ORD005', customer_phone: '+916393315685', product: 'Puja Thali Set', status: 'Out for Delivery', delivery: 'Today by 9 PM' },
];

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('✅ MongoDB connected');
    await Order.deleteMany({});
    await Order.insertMany(orders);
    console.log('✅ Orders seeded successfully!');
    console.log(`📦 ${orders.length} orders added to MongoDB`);
    mongoose.connection.close();
  })
  .catch(err => console.log('❌ Error:', err));