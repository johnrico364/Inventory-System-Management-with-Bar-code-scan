const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const cors = require("cors");

// routes imports
const productsRoutes = require("./routes/productRoutes");
const transactionRoutes = require("./routes/transactionRoutes");

const app = express();

// CORS configuration
const allowedOrigins = [
  'http://localhost:3000',
  'https://mom-inventory-system.vercel.app',
  'https://mom-inventory-system.vercel.app/'
];

app.use(cors({
  origin: function(origin, callback) {
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Handle preflight requests
app.options('*', cors());

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
