const express = require('express');
const Controller = require('../controllers/productController');

const router = express.Router();

router.post('/add', Controller.addProduct);

module.exports = router;