const Product = require("../models/productsSchema");
const Transaction = require("../models/transactionSchema");
const bwipjs = require("bwip-js");
const fs = require("fs");

const addProduct = async (req, res) => {
  const data = req.body;

  try {
    // Only check for duplicate description, allow duplicate categories
    if (data.description) {
      const existingProduct = await Product.findOne({
        description: {
          $regex: new RegExp(`^${data.description}$`, "i"), // Case-insensitive exact match
        },
      });
      if (existingProduct) {
        return res.status(400).json({
          message: "A product with this description already exists",
        });
      }
    }

    console.log(data);
    const newProduct = await Product.create(data);
    return res.status(200).json(newProduct);
  } catch (error) {
    console.log(error.message);
    return res
      .status(500)
      .json({ message: "Error adding product", error: error.message });
  }
};

// New function to check description uniqueness
const checkDescription = async (req, res) => {
  const { description } = req.query;

  if (!description) {
    return res.status(400).json({ message: "Description is required" });
  }

  try {
    const existingProduct = await Product.findOne({
      description: {
        $regex: new RegExp(`^${description}$`, "i"), // Case-insensitive exact match
      },
    });

    return res.status(200).json({ exists: !!existingProduct });
  } catch (error) {
    return res.status(500).json({
      message: "Error checking description",
      error: error.message,
    });
  }
};

const getProducts = async (req, res) => {
  try {
    const products = await Product.find({ isDeleted: false }).sort({
      description: 1,
    });
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
    console.log("Updating product:", { id, data }); // Debug log

    const product = await Product.findById(id);
    if (!product) {
      console.log("Product not found:", id); // Debug log
      return res.status(404).json({ message: "Product not found" });
    }

    // Handle stock updates
    if (data.action === "Stock in" || data.action === "Stock out") {
      console.log("Processing stock update:", {
        currentStock: product.stocks,
        action: data.action,
        quantity: data.quantity,
      }); // Debug log

      const quantity = parseInt(data.quantity);
      const previousStock = product.stocks;
      const newStocks =
        data.action === "Stock in"
          ? previousStock + quantity
          : previousStock - quantity;

      if (newStocks < 0) {
        console.log("Invalid stock update - would result in negative stock"); // Debug log
        return res.status(400).json({ message: "Stock cannot be negative" });
      }

      // Update the product's stock
      product.stocks = newStocks;
      const updatedProduct = await product.save();
      console.log("Product stock updated:", {
        previousStock,
        newStocks,
        productId: product._id,
      }); // Debug log

      // Create a transaction record
      const transaction = await Transaction.create({
        product: product._id,
        action: data.action,
        quantity: quantity,
        previousStock: previousStock,
        currentStock: newStocks,
      });
      console.log("Transaction record created:", transaction); // Debug log

      return res.status(200).json(updatedProduct);
    }

    // Check if a product with the same description already exists (excluding current product)
    if (data?.description) {
      const existingProduct = await Product.findOne({
        _id: { $ne: id }, // Exclude the current product
        description: {
          $regex: new RegExp(`^${data.description}$`, "i"), // Case-insensitive exact match
        },
      });

      if (existingProduct) {
        return res.status(400).json({
          message: "A product with this description already exists",
        });
      }
    }

    if (data?.action === "Product update") {
      // Update the product
      const updatedProduct = await Product.findByIdAndUpdate(id, data);
      return res.status(200).json({ message: "Product updated successfully" });
    }

    
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error updating product", error: error.message });
  }
};

const updateProductByBarcode = async (req, res) => {
  const { barcode } = req.params;
  const data = req.body;
  // console.log('Raw', data);


  try {
    // Convert barcode to number for comparison
    const barcodeNumber = parseInt(barcode);
    const product = await Product.findOne({
      barcode: barcodeNumber,
      isDeleted: false,
    });

    // console.log("Found product:", product);

    if (!product) {
      console.log("Product not found for barcode:", barcode);
      return res.status(404).json({ message: "Product not found" });
    }

    // Update the stocks field (not quantity)
    const updateData = {
      stocks: data.quantity || data.stocks,
      updatedAt: new Date(),
    };

    // console.log("Updating product with data:", updateData);

    const updatedProduct = await Product.findByIdAndUpdate(
      product._id,
      updateData,
      { new: true }
    );

    await Transaction.create({
      product: product._id,
      action: data.action,
      quantity: data.quantity,
      previousStock: product.stocks,
      currentStock: data.stocks,
    })

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

  try {
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    await Product.findByIdAndUpdate(id, { isDeleted: true });

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
      action: "Product Restored",
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
  const { barcode, quantity, type, timestamp, stocks } = req.body;
  console.log('manual', req.body)



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


    const previousStock = stocks;
    // Create a new transaction record
    const transactionData = {
      product: product._id,
      quantity: quantity,
      action: type === "IN" ? "Stock in" : "Stock out",
      previousStock: previousStock,
      // currentStock: 
    };

    const transaction = await Transaction.create(transactionData);

    return res.status(201).json({
      message: "Transaction logged successfully",
      transaction: transaction,
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
  const barcodesDir = "./barcodes";
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
        res
          .status(500)
          .json({ message: "Error generating barcode: " + err.message });
      } else {
        const filePath = `${barcodesDir}/${numberStr}.png`;
        fs.writeFileSync(filePath, png);
        console.log("✅ Barcode generated successfully:", filePath);
        res.status(200).json({
          message: "Barcode generated successfully",
          filePath: filePath,
        });
      }
    }
  );
};

// Hidden routes for testing purposes
const deleteProduct = async (req, res) => {
  const { id } = req.params;
  try {
    const product = await Product.findOneAndDelete(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error deleting product", error: error.message });
  }
};

module.exports = {
  addProduct,
  getProducts,
  checkDescription,
  getArchivedProducts,
  updateProduct,
  updateProductByBarcode,
  archiveProduct,
  restoreProduct,
  logTransaction,
  getProductHistory,
  generateBarcode,

  deleteProduct, // Hidden route for testing
};
