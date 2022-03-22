const express = require('express');
const router = express.Router();
const path = require('path');
const productsControllers = require('../controllers/productsControllers');

router.get('/detail', productsControllers.detail);

module.exports = router;