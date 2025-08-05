const express = require("express");
const Controller = require("../controllers/TransactionController");

const router = express.Router();

router.get('/get', Controller.getTransactions);
router.post('/add', Controller.addTransaction);

module.exports = router;