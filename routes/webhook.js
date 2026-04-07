const express = require('express');
const router = express.Router();
const { handleMessage } = require('../controllers/messageHandler');

router.post('/', handleMessage);

module.exports = router;