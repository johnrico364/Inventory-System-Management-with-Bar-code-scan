const express = require("express");
const mongoose = require("mongoose");

// routes imports
const productsRoutes = require("./routes/productRoutes");

const app = express();

// Simple CORS middleware without external package
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(express.json());

const _dbURI =
  "mongodb+srv://johnrico:John2004@projectsystems.cg2cala.mongodb.net/inventory_system?retryWrites=true&w=majority&appName=ProjectSystems";

mongoose.connect(_dbURI).then((result) => {
  console.log("Connected to MongoDB");
});

app.listen(4000, () => console.log("Listening on port 4000"));

app.use("/api/products", productsRoutes);
