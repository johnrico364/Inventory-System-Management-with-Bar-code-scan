"use client";

import { useState, useEffect } from "react";
import AddProductModal from "./modal/AddproductModal";
import EditProductModal from "./modal/EditProductModal";
import DeleteProductModal from "./modal/DeleteProductModal";
import StockInModal from "./modal/StockInModal";
import StockOutModal from "./modal/StockOutModal";
import { useDarkMode } from "../context/DarkModeContext";
import ProductDetails from "./Productdetails";
interface Product {
  _id: string;
  brand: string;
  barcode: number;
  description: string;
  category: string;
  stocks: number;
  boxColor?: string;
  boxNumber?: string;
  status: "in-stock" | "low-stock" | "out-of-stock";
  lastUpdated: string;
};

export default function Products() {
  const { darkMode, toggleDarkMode } = useDarkMode();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStockInModal, setShowStockInModal] = useState(false);
  const [showStockOutModal, setShowStockOutModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStockStatus, setSelectedStockStatus] = useState("all");
  const [selectedBrand, setSelectedBrand] = useState("all");
  const [sortBy, setSortBy] = useState("brand");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [error, setError] = useState("");
  const [barcodeImages, setBarcodeImages] = useState<{ [key: string]: string }>(
    {}
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Generate random barcode
  const generateBarcode = () => {
    return Date.now(); // Returns timestamp as barcode number
  };

  // Generate barcode image from backend
  const fetchBarcodeImage = async (barcodeNumber: number) => {
    try {
      console.log("🔄 Fetching barcode image for:", barcodeNumber);
      const imageUrl = `https://mom-inventory.vercel.app/barcodes/${barcodeNumber}.png`;
      
      // Check if the barcode image exists
      const response = await fetch(imageUrl, { method: 'HEAD' });
      
      if (response.ok) {
        console.log("✅ Barcode image found:", imageUrl);
        return imageUrl;
      } else {
        console.warn(`⚠️ Barcode image not found for ${barcodeNumber}: HTTP ${response.status}`);
        return null;
      }
    } catch (error) {
      console.error("❌ Error fetching barcode image:", error);
      return null;
    }
  };

  // Generate barcodes for all products
  const generateAllBarcodes = async () => {
    console.log("🎨 Starting barcode generation for all products...");
    const newBarcodeImages: { [key: string]: string } = {};

    for (const product of products) {
      // Skip if barcode already exists
      if (barcodeImages[product._id]) {
        newBarcodeImages[product._id] = barcodeImages[product._id];
        continue;
      }

      try {
        const barcodeImageUrl = await fetchBarcodeImage(product.barcode);
        if (barcodeImageUrl) {
          newBarcodeImages[product._id] = barcodeImageUrl;
          console.log(`✅ Generated barcode for ${product.brand}`);
        } else {
          console.log(`⚠️ Skipped barcode generation for ${product.brand}`);
        }
      } catch (error) {
        console.error(`❌ Failed to generate barcode for ${product.brand}:`, error);
        // Continue with other products even if one fails
      }
    }

    setBarcodeImages(newBarcodeImages);
    console.log("🏁 Barcode generation completed");
  };

  // Generate barcode for a single product
  const generateSingleBarcode = async (product: Product, retryCount = 0) => {
    console.log(
      "🎨 Generating barcode for single product:",
      product.brand,
      `(attempt ${retryCount + 1})`
    );
    const barcodeImageUrl = await fetchBarcodeImage(product.barcode);
    if (barcodeImageUrl) {
      setBarcodeImages((prev) => ({
        ...prev,
        [product._id]: barcodeImageUrl,
      }));
      console.log("✅ Barcode generated successfully for:", product.brand);
    } else if (retryCount < 2) {
      console.log("🔄 Retrying barcode generation for:", product.brand);
      setTimeout(() => generateSingleBarcode(product, retryCount + 1), 1000);
    } else {
      console.error(
        "❌ Failed to generate barcode after 3 attempts for:",
        product.brand
      );
    }
  };

  // Fetch products from API
  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError("");
      console.log("📡 Fetching products from API...");
      const response = await fetch("https://mom-inventory.vercel.app/api/products/get");
      console.log(
        "📥 Products response:",
        response.status,
        response.statusText
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("✅ Products fetched successfully:", data);
      setProducts(data);
    } catch (err) {
      console.error("❌ Error fetching products:", err);
      setError("Failed to fetch products. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Generate barcodes whenever products change
  useEffect(() => {
    if (products.length > 0) {
      generateAllBarcodes();
    }
  }, [products]);

  // Add this useEffect
  useEffect(() => {
    setCurrentPage(1); // Reset to first page when search/filters change
  }, [searchTerm, selectedCategory, selectedBrand, selectedStockStatus]);

  const getStockStatus = (stocks: number) => {
    if (stocks === 0) return "out-of-stock";
    if (stocks <= 10) return "low-stock";
    return "in-stock";
  };

  const filteredProducts = products
    .filter((product) => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        product.brand.toLowerCase().includes(searchLower) ||
        product.barcode.toString().includes(searchLower) ||
        product.description.toLowerCase().includes(searchLower) ||
        product.category.toLowerCase().includes(searchLower) ||
        product.stocks.toString().includes(searchLower);
      const matchesCategory =
        selectedCategory === "all" || product.category === selectedCategory;
      const matchesStockStatus =
        selectedStockStatus === "all" ||
        getStockStatus(product.stocks) === selectedStockStatus;
      const matchesBrand =
        selectedBrand === "all" || product.brand === selectedBrand;
      return matchesSearch && matchesCategory && matchesStockStatus && matchesBrand;
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case "brand":
          comparison = a.brand.localeCompare(b.brand);
          break;
        case "stocks":
          comparison = a.stocks - b.stocks;
          break;
        case "category":
          comparison = a.category.localeCompare(b.category);
          break;
        default:
          comparison = 0;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

  // Calculate pagination values
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const categories = [
    "all",
    ...Array.from(new Set(products.map((p) => p.category))),
  ];
  const brands = ["all", ...Array.from(new Set(products.map((p) => p.brand)))];
  const stockStatuses = ["all", "in-stock", "low-stock", "out-of-stock"];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "in-stock":
        return "bg-green-100 text-green-800";
      case "low-stock":
        return "bg-orange-100 text-orange-800";
      case "out-of-stock":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "in-stock":
        return "In Stock";
      case "low-stock":
        return "Low Stock";
      case "out-of-stock":
        return "Out of Stock";
      default:
        return status;
    }
  };

  const handleProductAdded = async (newProduct?: Product) => {
    console.log("🔄 Product added, refreshing products list...");
    await fetchProducts(); // Refresh the products list

    // If we have the new product data, generate its barcode immediately
    if (newProduct) {
      console.log("🎨 Generating barcode for new product:", newProduct);
      await generateSingleBarcode(newProduct);
    } else {
      console.log(
        "⚠️ No new product data provided, will generate barcodes for all products"
      );
      // Generate barcodes for all products if no specific product data
      await generateAllBarcodes();
    }
  };

  const handleProductUpdated = async () => {
    await fetchProducts(); // Refresh the products list
  };

  const handleProductDeleted = async () => {
    await fetchProducts(); // Refresh the products list
  };

  const handleOpenAddModal = () => {
    setShowAddModal(true);
  };

  const handleOpenEditModal = (product: Product) => {
    setSelectedProduct(product);
    setShowEditModal(true);
  };

  const handleOpenDeleteModal = (product: Product) => {
    setSelectedProduct(product);
    setShowDeleteModal(true);
  };

  // Print barcode label
  const handlePrintBarcode = async (product: Product) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow popups to print barcode labels");
      return;
    }

    let barcodeImageUrl = barcodeImages[product._id];
    
    // If barcode image doesn't exist, try to generate it
    if (!barcodeImageUrl) {
      console.log("🔄 Barcode not found, attempting to generate...");
      const generatedUrl = await fetchBarcodeImage(product.barcode);
      
      if (generatedUrl) {
        barcodeImageUrl = generatedUrl;
        // Update the barcodeImages state with the new image
        setBarcodeImages(prev => ({
          ...prev,
          [product._id]: generatedUrl
        }));
      }
    }

    // If still no barcode image, use a fallback or text-based barcode
    if (!barcodeImageUrl) {
      console.warn("⚠️ Using fallback barcode display");
    }

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Barcode Label - ${product.brand}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 20px;
              background: white;
            }
            .barcode-label {
              width: 300px;
              border: 2px solid #000;
              padding: 15px;
              margin: 10px;
              text-align: center;
              page-break-inside: avoid;
            }
            .product-info {
              margin-bottom: 10px;
            }
            .brand {
              font-size: 16px;
              font-weight: bold;
              margin-bottom: 5px;
            }
            .description {
              font-size: 12px;
              color: #666;
              margin-bottom: 5px;
            }
            .category {
              font-size: 11px;
              color: #888;
              margin-bottom: 10px;
            }
            .barcode-image {
              max-width: 100%;
              height: auto;
              margin: 10px 0;
            }
            .barcode-number {
              font-size: 12px;
              font-family: monospace;
              margin-top: 5px;
            }
            .stock-info {
              font-size: 11px;
              color: #666;
              margin-top: 5px;
            }
            @media print {
              body { margin: 0; }
              .barcode-label { 
                border: 1px solid #000; 
                margin: 5px;
                page-break-inside: avoid;
              }
            }
          </style>
        </head>
        <body>
          <div class="barcode-label">
            <div class="product-info">
              <div class="brand">${product.brand}</div>
              <div class="description">${product.description}</div>
              <div class="category">${product.category}</div>
            </div>
            ${barcodeImageUrl 
              ? `<img src="${barcodeImageUrl}" alt="Barcode: ${product.barcode}" class="barcode-image" />` 
              : `<div class="barcode-fallback" style="border: 2px solid #000; padding: 10px; margin: 10px 0; text-align: center;">
                   <div class="barcode-bars" style="display: flex; justify-content: center; align-items: end; height: 60px; margin-bottom: 5px;">
                     ${(() => {
                       const barcode = product.barcode.toString();
                       const patterns = ['101', '110100', '100110', '111010', '011001', '101001', '001011', '010011', '110001', '100011'];
                       let bars = '101'; // Start pattern
                       
                       for (let i = 0; i < barcode.length; i++) {
                         const digit = parseInt(barcode[i]);
                         bars += patterns[digit];
                         if (i < barcode.length - 1) bars += '0'; // Separator
                       }
                       bars += '101'; // End pattern
                       
                       return bars.split('').map((bit, index) => {
                         const width = Math.random() > 0.7 ? '3px' : Math.random() > 0.4 ? '2px' : '1px';
                         return bit === '1' 
                           ? `<div style="width: ${width}; height: 50px; background: #000; margin: 0;"></div>`
                           : `<div style="width: ${width}; height: 50px; background: transparent; margin: 0;"></div>`;
                       }).join('');
                     })()}
                   </div>
                   <div style="font-family: monospace; font-size: 14px; letter-spacing: 1px;">${product.barcode}</div>
                 </div>`
            }
            <div class="barcode-number">${product.barcode}</div>
            <div class="stock-info">Stock: ${product.stocks} units</div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();

    // Wait for images to load before printing
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    };
  };

  // Bulk print all barcode labels
  const handleBulkPrintBarcodes = async () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow popups to print barcode labels");
      return;
    }

    console.log("🖨️ Starting bulk print with fallback support...");

    // Generate missing barcodes or use fallback
    const updatedBarcodeImages = { ...barcodeImages };
    
    for (const product of products) {
      if (!updatedBarcodeImages[product._id]) {
        console.log(`🔄 Generating barcode for ${product.brand}...`);
        const generatedUrl = await fetchBarcodeImage(product.barcode);
        if (generatedUrl) {
          updatedBarcodeImages[product._id] = generatedUrl;
        }
      }
    }

    // Update state with any newly generated barcodes
    setBarcodeImages(updatedBarcodeImages);

    const labelsHtml = products
      .map((product) => {
        const barcodeImageUrl = updatedBarcodeImages[product._id];
        return `
        <div class="barcode-label">
          <div class="product-info">
            <div class="brand">${product.brand}</div>
            <div class="description">${product.description}</div>
            <div class="category">${product.category}</div>
          </div>
          ${barcodeImageUrl 
            ? `<img src="${barcodeImageUrl}" alt="Barcode: ${product.barcode}" class="barcode-image" />` 
            : `<div class="barcode-fallback" style="border: 2px solid #000; padding: 10px; margin: 10px 0; text-align: center;">
                 <div class="barcode-bars" style="display: flex; justify-content: center; align-items: end; height: 60px; margin-bottom: 5px;">
                   ${(() => {
                     const barcode = product.barcode.toString();
                     const patterns = ['101', '110100', '100110', '111010', '011001', '101001', '001011', '010011', '110001', '100011'];
                     let bars = '101'; // Start pattern
                     
                     for (let i = 0; i < barcode.length; i++) {
                       const digit = parseInt(barcode[i]);
                       bars += patterns[digit];
                       if (i < barcode.length - 1) bars += '0'; // Separator
                     }
                     bars += '101'; // End pattern
                     
                     return bars.split('').map((bit, index) => {
                       const width = Math.random() > 0.7 ? '3px' : Math.random() > 0.4 ? '2px' : '1px';
                       return bit === '1' 
                         ? `<div style="width: ${width}; height: 50px; background: #000; margin: 0;"></div>`
                         : `<div style="width: ${width}; height: 50px; background: transparent; margin: 0;"></div>`;
                     }).join('');
                   })()}
                 </div>
                 <div style="font-family: monospace; font-size: 14px; letter-spacing: 1px;">${product.barcode}</div>
               </div>`
          }
          <div class="barcode-number">${product.barcode}</div>
          <div class="stock-info">Stock: ${product.stocks} units</div>
        </div>
      `;
      })
      .join("");

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Bulk Barcode Labels - ${products.length} Products</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 20px;
              background: white;
            }
            .barcode-label {
              width: 300px;
              border: 2px solid #000;
              padding: 15px;
              margin: 10px;
              text-align: center;
              page-break-inside: avoid;
              display: inline-block;
              vertical-align: top;
            }
            .product-info {
              margin-bottom: 10px;
            }
            .brand {
              font-size: 16px;
              font-weight: bold;
              margin-bottom: 5px;
            }
            .description {
              font-size: 12px;
              color: #666;
              margin-bottom: 5px;
            }
            .category {
              font-size: 11px;
              color: #888;
              margin-bottom: 10px;
            }
            .barcode-image {
              max-width: 100%;
              height: auto;
              margin: 10px 0;
            }
            .barcode-number {
              font-size: 12px;
              font-family: monospace;
              margin-top: 5px;
            }
            .stock-info {
              font-size: 11px;
              color: #666;
              margin-top: 5px;
            }
            .header {
              text-align: center;
              margin-bottom: 20px;
              padding: 10px;
              background: #f8f9fa;
              border-radius: 5px;
            }
            .header h1 {
              margin: 0;
              font-size: 18px;
              color: #333;
            }
            .header p {
              margin: 5px 0 0 0;
              font-size: 14px;
              color: #666;
            }
            @media print {
              body { margin: 0; }
              .barcode-label { 
                border: 1px solid #000; 
                margin: 5px;
                page-break-inside: avoid;
              }
              .header {
                background: none;
                border: 1px solid #ddd;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Inventory Barcode Labels</h1>
            <p>Total Products: ${
              products.length
            } | Generated: ${new Date().toLocaleString()}</p>
          </div>
          ${labelsHtml}
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();

    // Wait for images to load before printing
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 1000);
    };
  };

  // Pagination controls component
  const PaginationControls = ({ 
    currentPage, 
    totalPages, 
    onPageChange, 
    itemsPerPage, 
    onItemsPerPageChange,
    darkMode 
  }: {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    itemsPerPage: number;
    onItemsPerPageChange: (items: number) => void;
    darkMode: boolean;
  }) => {
    return (
      <div className="flex items-center justify-between mt-4 px-4">
        <div className="flex items-center gap-2">
          <select
            value={itemsPerPage}
            onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
            className={`px-2 py-1 border rounded-md ${
              darkMode
                ? "bg-gray-800 text-gray-200 border-gray-700"
                : "bg-white text-gray-900 border-gray-300"
            }`}
          >
            <option value={5}>5 per page</option>
            <option value={10}>10 per page</option>
            <option value={20}>20 per page</option>
            <option value={50}>50 per page</option>
          </select>
          <span className={darkMode ? "text-gray-300" : "text-gray-600"}>
            Page {currentPage} of {totalPages}
          </span>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            className={`px-3 py-1 rounded-md ${
              darkMode
                ? "bg-gray-800 text-gray-200 disabled:bg-gray-700 disabled:text-gray-500"
                : "bg-white text-gray-900 disabled:bg-gray-100 disabled:text-gray-400"
            } border ${
              darkMode ? "border-gray-700" : "border-gray-300"
            }`}
          >
            First
          </button>
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`px-3 py-1 rounded-md ${
              darkMode
                ? "bg-gray-800 text-gray-200 disabled:bg-gray-700 disabled:text-gray-500"
                : "bg-white text-gray-900 disabled:bg-gray-100 disabled:text-gray-400"
            } border ${
              darkMode ? "border-gray-700" : "border-gray-300"
            }`}
          >
            Previous
          </button>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`px-3 py-1 rounded-md ${
              darkMode
                ? "bg-gray-800 text-gray-200 disabled:bg-gray-700 disabled:text-gray-500"
                : "bg-white text-gray-900 disabled:bg-gray-100 disabled:text-gray-400"
            } border ${
              darkMode ? "border-gray-700" : "border-gray-300"
            }`}
          >
            Next
          </button>
          <button
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
            className={`px-3 py-1 rounded-md ${
              darkMode
                ? "bg-gray-800 text-gray-200 disabled:bg-gray-700 disabled:text-gray-500"
                : "bg-white text-gray-900 disabled:bg-gray-100 disabled:text-gray-400"
            } border ${
              darkMode ? "border-gray-700" : "border-gray-300"
            }`}
          >
            Last
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div
        className={
          darkMode
            ? "min-h-screen flex items-center justify-center bg-gray-900"
            : "min-h-screen flex items-center justify-center bg-gray-50"
        }
      >
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div
      className={
        darkMode
          ? "min-h-screen bg-gray-900 text-white transition-colors"
          : "min-h-screen bg-white transition-colors"
      }
    >
      {/* Header */}
      <div
        className={
          darkMode
            ? "bg-gradient-to-r from-blue-950 via-blue-900 to-blue-800 shadow-lg border-b border-blue-950"
            : "bg-gradient-to-r from-blue-900 via-blue-800 to-blue-700 shadow-lg border-b border-blue-900"
        }
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-white">Products</h1>
              <p
                className={
                  darkMode ? "text-blue-200 mt-1" : "text-blue-100 mt-1"
                }
              >
                Manage your inventory products
              </p>
            </div>
            <div className="mt-4 sm:mt-0 flex gap-2">
              <button
                onClick={handleOpenAddModal}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                + Add Product
              </button>
              <button
                onClick={handleBulkPrintBarcodes}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
                title="Print all barcode labels"
              >
                🖨️ Bulk Print
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="max-w-[100rem] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div
          className={
            darkMode
              ? "bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-4 mb-6"
              : "bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6"
          }
        >
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 ${
                  darkMode
                    ? "bg-gray-900 text-white placeholder-gray-400"
                    : "bg-white text-gray-900 placeholder-gray-500"
                }`}
              />
            </div>

            <div className="w-48">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 ${
                  darkMode
                    ? "bg-gray-900 text-blue-100"
                    : "bg-white text-blue-900"
                }`}
              >
                <option value="all">All Categories</option>
                {categories
                  .filter((cat) => cat !== "all")
                  .map((cat) => (
                    <option
                      key={cat}
                      value={cat}
                      className={
                        darkMode
                          ? "bg-gray-900 text-blue-100"
                          : "bg-white text-blue-900"
                      }
                    >
                      {cat}
                    </option>
                  ))}
              </select>
            </div>

            <div className="w-48">
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 ${
                  darkMode
                    ? "bg-gray-900 text-blue-100"
                    : "bg-white text-blue-900"
                }`}
              >
                <option value="all">All Brands</option>
                {brands
                  .filter((brand) => brand !== "all")
                  .map((brand) => (
                    <option
                      key={brand}
                      value={brand}
                      className={
                        darkMode
                          ? "bg-gray-900 text-blue-100"
                          : "bg-white text-blue-900"
                      }
                    >
                      {brand}
                    </option>
                  ))}
              </select>
            </div>

            <div className="w-48">
              <select
                value={selectedStockStatus}
                onChange={(e) => setSelectedStockStatus(e.target.value)}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 ${
                  darkMode
                    ? "bg-gray-900 text-blue-100"
                    : "bg-white text-blue-900"
                }`}
              >
                <option value="all">All Stock Status</option>
                {stockStatuses
                  .filter((status) => status !== "all")
                  .map((status) => (
                    <option
                      key={status}
                      value={status}
                      className={
                        darkMode
                          ? "bg-gray-900 text-blue-100"
                          : "bg-white text-blue-900"
                      }
                    >
                      {status
                        .split("-")
                        .map(
                          (word) => word.charAt(0).toUpperCase() + word.slice(1)
                        )
                        .join(" ")}
                    </option>
                  ))}
              </select>
            </div>
          </div>
        </div>

        {/* Products Table */}
        <div
          className={
            darkMode
              ? "bg-gray-800 rounded-lg shadow-lg border border-gray-700 overflow-hidden w-full max-w-[98vw] mx-auto"
              : "bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden w-full max-w-[98vw] mx-auto"
          }
        >
          <div className="overflow-x-auto">
            <table
              className={
                darkMode
                  ? "w-full divide-y divide-gray-700"
                  : "w-full divide-y divide-gray-200"
              }
            >
              <thead className={darkMode ? "bg-gray-800" : "bg-gray-50"}>
                <tr>
                  {/* Barcode img */}
                  {/* <th
                    className={
                      darkMode
                        ? "px-6 py-3 text-left text-xs font-semibold text-gray-300 uppercase"
                        : "px-6 py-3 text-left text-xs font-semibold text-blue-800 uppercase"
                    }
                  >
                    Barcode
                  </th> */}
                  <th
                    className={
                      darkMode
                        ? "px-6 py-3 text-left text-xs font-semibold text-gray-300"
                        : "px-6 py-3 text-left text-xs font-semibold text-blue-800"
                    }
                  >
                    Barcode Number
                  </th>
                  <th
                    className={
                      darkMode
                        ? "px-6 py-3 text-left text-xs font-semibold text-gray-300 uppercase"
                        : "px-6 py-3 text-left text-xs font-semibold text-blue-800 uppercase"
                    }
                  >
                    Brand
                  </th>
                  <th
                    className={
                      darkMode
                        ? "px-6 py-3 text-left text-xs font-semibold text-gray-300 uppercase"
                        : "px-6 py-3 text-left text-xs font-semibold text-blue-800 uppercase"
                    }
                  >
                    Description
                  </th>
                  <th
                    className={
                      darkMode
                        ? "px-6 py-3 text-left text-xs font-semibold text-gray-300 uppercase"
                        : "px-6 py-3 text-left text-xs font-semibold text-blue-800 uppercase"
                    }
                  >
                    Category
                  </th>
                  <th
                    className={
                      darkMode
                        ? "px-6 py-3 text-left text-xs font-semibold text-gray-300 uppercase"
                        : "px-6 py-3 text-left text-xs font-semibold text-blue-800 uppercase"
                    }
                  >
                    Stocks
                  </th>
                  <th
                    className={
                      darkMode
                        ? "px-6 py-3 text-left text-xs font-semibold text-gray-300 uppercase"
                        : "px-6 py-3 text-left text-xs font-semibold text-blue-800 uppercase"
                    }
                  >
                    Box Color
                  </th>
                  <th
                    className={
                      darkMode
                        ? "px-6 py-3 text-left text-xs font-semibold text-gray-300 uppercase"
                        : "px-6 py-3 text-left text-xs font-semibold text-blue-800 uppercase"
                    }
                  >
                    Box Number
                  </th>
                  <th
                    className={
                      darkMode
                        ? "px-6 py-3 text-left text-xs font-semibold text-gray-300 uppercase"
                        : "px-6 py-3 text-left text-xs font-semibold text-blue-800 uppercase"
                    }
                  >
                    In/Out
                  </th>
                  <th
                    className={
                      darkMode
                        ? "px-6 py-3 text-left text-xs font-semibold text-gray-300"
                        : "px-6 py-3 text-left text-xs font-semibold text-blue-800"
                    }
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody
                className={
                  darkMode
                    ? "bg-gray-900 divide-y divide-gray-700"
                    : "bg-white divide-y divide-gray-200"
                }
              >
                {currentItems.map((product) => {
                  return (
                    <tr
                      key={product._id}
                      className={
                        darkMode ? "hover:bg-gray-800" : "hover:bg-gray-50"
                      }
                    >
                    
                      <td
                        className={
                          darkMode
                            ? "px-6 py-8 text-sm text-gray-300"
                            : "px-6 py-8 text-sm text-blue-800"
                        }
                      >
                        {product.barcode}
                      </td>

                     <td
                        className={
                          darkMode
                            ? "px-6 py-8 text-sm text-gray-300"
                            : "px-6 py-8 text-sm text-blue-800"
                        }
                      >
                        {product.brand}
                      </td>

                      <td
                        className={
                          darkMode
                            ? "px-6 py-8 text-sm text-gray-300"
                            : "px-6 py-8 text-sm text-blue-800"
                        }
                      >
                        {product.description}
                      </td>
                      <td
                        className={
                          darkMode
                            ? "px-6 py-8 text-sm text-gray-300"
                            : "px-6 py-8 text-sm text-blue-800"
                        }
                      >
                        {product.category}
                      </td>
                      <td
                        className={
                          darkMode
                            ? "px-6 py-8 text-sm text-gray-300"
                            : "px-6 py-8 text-sm text-blue-800"
                        }
                      >
                        {product.stocks}
                      </td>
                      <td
                        className={
                          darkMode
                            ? "px-6 py-8 text-sm text-gray-300"
                            : "px-6 py-8 text-sm text-blue-800"
                        }
                      >
                        {product.boxColor || "-"}
                      </td>
                      <td
                        className={
                          darkMode
                            ? "px-6 py-8 text-sm text-gray-300"
                            : "px-6 py-8 text-sm text-blue-800"
                        }
                      >
                        {product.boxNumber || "-"}
                      </td>
                      <td className="px-6 py-4 text-sm text-blue-800">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setSelectedProduct(product);
                              setShowStockInModal(true);
                            }}
                            className={
                              darkMode
                                ? "text-blue-400 hover:text-blue-300 bg-blue-900/50 hover:bg-blue-800 px-2 py-1 rounded text-xs font-medium transition-colors"
                                : "text-blue-600 hover:text-blue-900 bg-blue-100 hover:bg-blue-200 px-2 py-1 rounded text-xs font-medium transition-colors"
                            }
                          >
                            Stock in
                          </button>

                          <button
                            onClick={() => {
                              setSelectedProduct(product);
                              setShowStockOutModal(true);
                            }}
                            className={
                              darkMode
                                ? "text-red-400 hover:text-red-300 bg-red-900/50 hover:bg-red-800 px-2 py-1 rounded text-xs font-medium transition-colors"
                                : "text-red-600 hover:text-red-900 bg-red-100 hover:bg-red-200 px-2 py-1 rounded text-xs font-medium transition-colors"
                            }
                          >
                            Stock out
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-blue-800">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleOpenEditModal(product)}
                            className={
                              darkMode
                                ? "text-blue-400 hover:text-blue-300 bg-blue-900/50 hover:bg-blue-800 px-2 py-1 rounded text-xs font-medium transition-colors"
                                : "text-blue-600 hover:text-blue-900 bg-blue-100 hover:bg-blue-200 px-2 py-1 rounded text-xs font-medium transition-colors"
                            }
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handlePrintBarcode(product)}
                            className={
                              darkMode
                                ? "text-green-400 hover:text-green-300 bg-green-900/50 hover:bg-green-800 px-2 py-1 rounded text-xs font-medium transition-colors"
                                : "text-green-600 hover:text-green-900 bg-green-100 hover:bg-green-200 px-2 py-1 rounded text-xs font-medium transition-colors"
                            }
                            title="Print Barcode Label"
                          >
                            🖨️
                          </button>
                          <button
                            onClick={() => handleOpenDeleteModal(product)}
                            className={
                              darkMode
                                ? "text-red-400 hover:text-red-300 bg-red-900/50 hover:bg-red-800 px-2 py-1 rounded text-xs font-medium transition-colors"
                                : "text-red-600 hover:text-red-900 bg-red-100 hover:bg-red-200 px-2 py-1 rounded text-xs font-medium transition-colors"
                            }
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(page) => {
            setCurrentPage(page);
            // Scroll to top of table
            document.querySelector('.overflow-x-auto')?.scrollTo({ behavior: 'smooth' });
          }}
          itemsPerPage={itemsPerPage}
          onItemsPerPageChange={(items) => {
            setItemsPerPage(items);
            setCurrentPage(1); // Reset to first page when changing items per page
          }}
          darkMode={darkMode}
        />

        {/* Update the products count display */}
        <div className={darkMode ? "mt-4 text-sm text-gray-400" : "mt-4 text-sm text-gray-600"}>
          Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredProducts.length)} of {filteredProducts.length} products
        </div>
      </div>

      {/* Add Product Modal */}
      <AddProductModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onProductAdded={handleProductAdded}
      />

      {/* Edit Product Modal */}
      <EditProductModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onProductUpdated={handleProductUpdated}
        product={selectedProduct || null}
      />

      {/* Delete Product Modal */}
      <DeleteProductModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onProductDeleted={handleProductDeleted}
        product={selectedProduct}
      />

      {/* Product Details Modal */}
      {selectedProduct && (
        <ProductDetails
          product={selectedProduct}
          isOpen={showDetails}
          onClose={() => setShowDetails(false)}
        />
      )}

      {/* Stock In Modal */}
      {selectedProduct && (
        <StockInModal
          isOpen={showStockInModal}
          onClose={() => setShowStockInModal(false)}
          product={selectedProduct}
          onStockUpdated={handleProductUpdated}
        />
      )}

      {/* Stock Out Modal */}
      {selectedProduct && (
        <StockOutModal
          isOpen={showStockOutModal}
          onClose={() => setShowStockOutModal(false)}
          product={selectedProduct}
          onStockUpdated={handleProductUpdated}
        />
      )}
    </div>
  );
}
