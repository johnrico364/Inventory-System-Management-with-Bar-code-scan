const express = require("express");
const Controller = require("../controllers/productController");

const router = express.Router();

router.post("/add", Controller.addProduct);
router.get("/get", Controller.getProducts);
router.get("/archived", Controller.getArchivedProducts);
router.patch("/update/:id", Controller.updateProduct);
router.patch("/delete/:id", Controller.deleteProduct);
router.patch("/restore/:id", Controller.restoreProduct);

// New routes for mobile app
router.put("/update/:barcode", Controller.updateProductByBarcode);
router.post("/transaction", Controller.logTransaction);
router.get("/history/:barcode", Controller.getProductHistory);

module.exports = router;
