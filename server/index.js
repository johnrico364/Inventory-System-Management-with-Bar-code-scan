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
  'https://mom-inventory.vercel.app',
  'https://mom-inventory.vercel.app/'
];

// Simplified CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check if the origin is in the allowed list
    const allowed = allowedOrigins.some(allowedUrl => {
      return origin === allowedUrl || 
             origin.replace(/\/$/, '') === allowedUrl.replace(/\/$/, '');
    });
    
    callback(null, allowed);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 204,
  preflightContinue: false
};

// Apply CORS to all routes
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Enable preflight for all routes

// Add CORS headers manually as a fallback
app.use(function(req, res, next) {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin) || allowedOrigins.includes(origin + '/')) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
  }
  next();
});

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
