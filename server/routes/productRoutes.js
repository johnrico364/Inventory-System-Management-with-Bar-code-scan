const express = require("express");
const Controller = require("../controllers/productController");

const router = express.Router();

router.post("/add", Controller.addProduct);
router.get("/get", Controller.getProducts);
router.patch("/update/:id", Controller.updateProduct);
router.patch("/delete/:id", Controller.deleteProduct);

module.exports = router;
