const Product = require("../models/productsSchema");
const Transaction = require("../models/transactionSchema");
const bwipjs = require("bwip-js");
const fs = require("fs");

const addProduct = async (req, res) => {
  const data = req.body;

  try {
    const newProduct = await Product.create(data);

    // Create a transaction record for the new product
    const transactionData = {
      product: newProduct._id,
      quantity: data.stocks || 0,
      action: "Product Added"
    };

    await Transaction.create(transactionData);

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
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const updatedProduct = await Product.findByIdAndUpdate(id, data, { new: true });

    // Create a transaction record for the product update
    const transactionData = {
      product: product._id,
      quantity: data.stocks || data.quantity || 0,
      action: "Product Update"
    };

    await Transaction.create(transactionData);

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

    // Create a transaction record for the stock update
    // const transactionData = {
    //   product: product._id,
    //   quantity: data.quantity || data.stocks,
    //   action: "Stock In"
    // };

    // await Transaction.create(transactionData);

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
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    await Product.findByIdAndUpdate(id, { isDeleted: isDeleted || true });

    // Create a transaction record for archiving
    const transactionData = {
      product: product._id,
      quantity: product.stocks,
      action: "Product Archived"
    };

    await Transaction.create(transactionData);

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
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    await Product.findByIdAndUpdate(id, { isDeleted: false });

    // Create a transaction record for restoration
    const transactionData = {
      product: product._id,
      quantity: product.stocks,
      action: "Product Restored"
    };

    await Transaction.create(transactionData);

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
    // Find the product by barcode
    const barcodeNumber = parseInt(barcode);
    const product = await Product.findOne({
      barcode: barcodeNumber,
      isDeleted: false,
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Create a new transaction record
    const transactionData = {
      product: product._id,
      quantity: quantity,
      action: type === 'IN' ? 'Stock In' : 'Stock Out',
      timestamp: timestamp || new Date(),
      notes: notes
    };

    const transaction = await Transaction.create(transactionData);

    return res.status(201).json({ 
      message: "Transaction logged successfully",
      transaction: transaction 
    });
  } catch (error) {
    console.error("Error logging transaction:", error);
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
  
  if (!number) {
    return res.status(400).json({ message: "Barcode number is required" });
  }

  const numberStr = number.toString();
  console.log("🎨 Generating barcode for:", numberStr);

  // Ensure barcodes directory exists
  const barcodesDir = './barcodes';
  if (!fs.existsSync(barcodesDir)) {
    fs.mkdirSync(barcodesDir, { recursive: true });
  }

  bwipjs.toBuffer(
    {
      bcid: "code128",
      text: numberStr,
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
        console.error("❌ Error generating barcode:", err);
        res.status(500).json({ message: "Error generating barcode: " + err.message });
      } else {
        const filePath = `${barcodesDir}/${numberStr}.png`;
        fs.writeFileSync(filePath, png);
        console.log("✅ Barcode generated successfully:", filePath);
        res.status(200).json({ 
          message: "Barcode generated successfully",
          filePath: filePath
        });
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
