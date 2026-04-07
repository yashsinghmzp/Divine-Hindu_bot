const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();

const webhookRoute = require('./routes/webhook');

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Routes
app.use('/webhook', webhookRoute);

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.log('❌ MongoDB error:', err));

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});