const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const cors = require("cors");

// routes imports
const productsRoutes = require("./routes/productRoutes");
const transactionRoutes = require("./routes/transactionRoutes");

const app = express();

// CORS configuration
app.use(cors({
  origin: 'http://localhost:3000', // Allow your Next.js frontend
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], // Allowed methods
  allowedHeaders: ['Content-Type', 'Authorization'], // Allowed headers
  credentials: true // Allow credentials
}));

app.use(express.json());

// Serve static files from barcodes directory
app.use('/barcodes', express.static(path.join(__dirname, 'barcodes')));

const _dbURI = "mongodb://localhost:27017/inventory_system";

mongoose.connect(_dbURI).then((result) => {
  console.log("Connected to Local MongoDB");
});

app.listen(4000, () => console.log("Listening on port 4000"));

app.use("/api/products", productsRoutes);
app.use('/api/transactions', transactionRoutes);
