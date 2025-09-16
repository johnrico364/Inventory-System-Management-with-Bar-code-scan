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

const corsOptions = {
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check if the origin is in the allowed list or is a subdomain
    const originUrl = new URL(origin);
    const isAllowed = allowedOrigins.some(allowed => {
      const allowedUrl = new URL(allowed.endsWith('/') ? allowed : `${allowed}/`);
      return originUrl.hostname === allowedUrl.hostname;
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

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
