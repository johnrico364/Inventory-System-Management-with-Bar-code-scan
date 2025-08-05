const Product = require("../models/productsSchema");
const bwipjs = require("bwip-js");
const fs = require("fs");

const addProduct = async (req, res) => {
  const data = req.body;

  try {
    const newProduct = await Product.create(data);

    return res.status(200).json(newProduct);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error adding product", error: error.message });
  }
};

const getProducts = async (req, res) => {
  try {
    const products = await Product.find({ isDeleted: false });
    return res.status(200).json(products);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error fetching products", error: error.message });
  }
};

const getArchivedProducts = async (req, res) => {
  try {
    const archivedProducts = await Product.find({ isDeleted: true });
    return res.status(200).json(archivedProducts);
  } catch (error) {
    return res.status(500).json({
      message: "Error fetching archived products",
      error: error.message,
    });
  }
};

const updateProduct = async (req, res) => {
  const { id } = req.params;
  const data = req.body;
  try {
    await Product.findByIdAndUpdate(id, data);
    return res.status(200).json({ message: "Product updated successfully" });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error updating product", error: error.message });
  }
};

const updateProductByBarcode = async (req, res) => {
  const { barcode } = req.params;
  const data = req.body;

  console.log("Update request received:", { barcode, data });

  try {
    // Convert barcode to number for comparison
    const barcodeNumber = parseInt(barcode);
    const product = await Product.findOne({
      barcode: barcodeNumber,
      isDeleted: false,
    });

    console.log("Found product:", product);

    if (!product) {
      console.log("Product not found for barcode:", barcode);
      return res.status(404).json({ message: "Product not found" });
    }

    // Update the stocks field (not quantity)
    const updateData = {
      stocks: data.quantity || data.stocks,
      updatedAt: new Date(),
    };

    console.log("Updating product with data:", updateData);

    const updatedProduct = await Product.findByIdAndUpdate(
      product._id,
      updateData,
      { new: true }
    );

    console.log("Product updated successfully:", updatedProduct);
    return res.status(200).json({
      message: "Product updated successfully",
      product: updatedProduct,
    });
  } catch (error) {
    console.error("Error updating product:", error);
    return res
      .status(500)
      .json({ message: "Error updating product", error: error.message });
  }
};

const archiveProduct = async (req, res) => {
  const { id } = req.params;
  const { isDeleted } = req.body;
  try {
    await Product.findByIdAndUpdate(id, { isDeleted: isDeleted || true });
    return res.status(200).json({ message: "Product archived successfully" });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error archiving product", error: error.message });
  }
};

const restoreProduct = async (req, res) => {
  const { id } = req.params;
  try {
    await Product.findByIdAndUpdate(id, { isDeleted: false });
    return res.status(200).json({ message: "Product restored successfully" });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error restoring product", error: error.message });
  }
};

const logTransaction = async (req, res) => {
  const { barcode, quantity, type, timestamp, notes } = req.body;

  try {
    // For now, we'll just log to console. In a real app, you might want to store this in a separate collection
    console.log("Transaction logged:", {
      barcode,
      quantity,
      type,
      timestamp,
      notes,
    });

    return res.status(201).json({ message: "Transaction logged successfully" });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error logging transaction", error: error.message });
  }
};

const getProductHistory = async (req, res) => {
  const { barcode } = req.params;

  try {
    // For now, return empty array. In a real app, you would query a transactions collection
    return res.status(200).json([]);
  } catch (error) {
    return res.status(500).json({
      message: "Error fetching product history",
      error: error.message,
    });
  }
};

const generateBarcode = async (req, res) => {
  const { number } = req.body;
  number.toString();

  bwipjs.toBuffer(
    {
      bcid: "code128",
      text: number,
      scale: 3,
      height: 10,
      includetext: true,
      textxalign: "center",
      padding: 10,
      backgroundcolor: "#ffffff",
      encoding: "UTF-8",
    },
    (err, png) => {
      if (err) {
        console.log("Error generatiing barcode", err);
        res.status(500).json({ message: "Error generatiing barcode" + err });
      } else {
        fs.writeFileSync(`./barcodes/${number}.png`, png);
        console.log("Barcode generated successfully");
        res.status(200).json({ message: "Barcode generated successfully" });
      }
    }
  );
};

module.exports = {
  addProduct,
  getProducts,
  getArchivedProducts,
  updateProduct,
  updateProductByBarcode,
  archiveProduct,
  restoreProduct,
  logTransaction,
  getProductHistory,
  generateBarcode
};
