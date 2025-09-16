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
  // origin: 'http://localhost:3000',
  origin: 'https://mom-inventory-system.vercel.app/',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());

// Serve static files from barcodes directory
app.use('/barcodes', express.static(path.join(__dirname, 'barcodes')));

const dbURI = 'mongodb+srv://john:John2004@personalproject.fkzdsfo.mongodb.net/inventory_system?retryWrites=true&w=majority&appName=PersonalProject'

mongoose.connect(dbURI).then(() => {
  console.log("Connected to MongoDB");
});

app.listen(4000, () => console.log(`Listening on port 4000`));

app.use("/api/products", productsRoutes);
app.use('/api/transactions', transactionRoutes);
