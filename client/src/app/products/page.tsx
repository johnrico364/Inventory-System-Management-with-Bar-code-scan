'use client';

import { useState, useEffect } from 'react';
import AddProductModal from './modal/AddproductModal';
import EditProductModal from './modal/EditProductModal';
import DeleteProductModal from './modal/DeleteProductModal';
import ProductDetails from './Productdetails';

interface Product {
  _id: string;
  brand: string;
  barcode: number;
  description: string;
  category: string;
  stocks: number;
  status: 'in-stock' | 'low-stock' | 'out-of-stock';
  lastUpdated: string;
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [error, setError] = useState('');
  const [barcodeImages, setBarcodeImages] = useState<{[key: string]: string}>({});

  // Generate random barcode
  const generateBarcode = () => {
    return Date.now(); // Returns timestamp as barcode number
  };

  // Generate barcode image from backend
  const generateBarcodeImage = async (barcodeNumber: number) => {
    try {
      console.log('🎨 Generating barcode for:', barcodeNumber);
      const response = await fetch('http://localhost:4000/api/products/generate-barcode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ number: barcodeNumber.toString() }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Barcode generated successfully:', result);
      
      // Add a small delay to ensure the file is fully written
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Return the path to the generated barcode image
      return `http://localhost:4000/barcodes/${barcodeNumber}.png`;
    } catch (error) {
      console.error('❌ Error generating barcode:', error);
      return null;
    }
  };

  // Generate barcodes for all products
  const generateAllBarcodes = async () => {
    console.log('🎨 Starting barcode generation for', products.length, 'products');
    
    const newBarcodeImages: {[key: string]: string} = {};
    
    for (const product of products) {
      // Skip if barcode already exists
      if (barcodeImages[product._id]) {
        newBarcodeImages[product._id] = barcodeImages[product._id];
        continue;
      }
      
      const barcodeImageUrl = await generateBarcodeImage(product.barcode);
      if (barcodeImageUrl) {
        newBarcodeImages[product._id] = barcodeImageUrl;
      }
    }
    
    setBarcodeImages(newBarcodeImages);
    console.log('🎨 Barcode generation completed');
  };

  // Generate barcode for a single product
  const generateSingleBarcode = async (product: Product, retryCount = 0) => {
    console.log('🎨 Generating barcode for single product:', product.brand, `(attempt ${retryCount + 1})`);
    const barcodeImageUrl = await generateBarcodeImage(product.barcode);
    if (barcodeImageUrl) {
      setBarcodeImages(prev => ({
        ...prev,
        [product._id]: barcodeImageUrl
      }));
      console.log('✅ Barcode generated successfully for:', product.brand);
    } else if (retryCount < 2) {
      console.log('🔄 Retrying barcode generation for:', product.brand);
      setTimeout(() => generateSingleBarcode(product, retryCount + 1), 1000);
    } else {
      console.error('❌ Failed to generate barcode after 3 attempts for:', product.brand);
    }
  };

  // Fetch products from API
  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('📡 Fetching products from API...');
      const response = await fetch('http://localhost:4000/api/products/get');
      console.log('📥 Products response:', response.status, response.statusText);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('✅ Products fetched successfully:', data);
      setProducts(data);
    } catch (err) {
      console.error('❌ Error fetching products:', err);
      setError('Failed to fetch products. Please try again.');
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

  const filteredProducts = products.filter(product => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      product.brand.toLowerCase().includes(searchLower) ||
      product.barcode.toString().includes(searchLower) ||
      product.description.toLowerCase().includes(searchLower) ||
      product.category.toLowerCase().includes(searchLower) ||
      product.stocks.toString().includes(searchLower);
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['all', ...Array.from(new Set(products.map(p => p.category)))];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in-stock': return 'bg-green-100 text-green-800';
      case 'low-stock': return 'bg-orange-100 text-orange-800';
      case 'out-of-stock': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'in-stock': return 'In Stock';
      case 'low-stock': return 'Low Stock';
      case 'out-of-stock': return 'Out of Stock';
      default: return status;
    }
  };

  const handleProductAdded = async (newProduct?: Product) => {
    console.log('🔄 Product added, refreshing products list...');
    await fetchProducts(); // Refresh the products list
    
    // If we have the new product data, generate its barcode immediately
    if (newProduct) {
      console.log('🎨 Generating barcode for new product:', newProduct);
      await generateSingleBarcode(newProduct);
    } else {
      console.log('⚠️ No new product data provided, will generate barcodes for all products');
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
  const handlePrintBarcode = (product: Product) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to print barcode labels');
      return;
    }

    const barcodeImageUrl = barcodeImages[product._id];
    if (!barcodeImageUrl) {
      alert('Barcode image not available. Please wait for it to load.');
      return;
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
            <img src="${barcodeImageUrl}" alt="Barcode: ${product.barcode}" class="barcode-image" />
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
  const handleBulkPrintBarcodes = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to print barcode labels');
      return;
    }

    // Check if all barcodes are loaded
    const productsWithoutBarcodes = products.filter(product => !barcodeImages[product._id]);
    if (productsWithoutBarcodes.length > 0) {
      alert(`Barcode images not available for ${productsWithoutBarcodes.length} products. Please wait for them to load.`);
      return;
    }

    const labelsHtml = products.map(product => {
      const barcodeImageUrl = barcodeImages[product._id];
      return `
        <div class="barcode-label">
          <div class="product-info">
            <div class="brand">${product.brand}</div>
            <div class="description">${product.description}</div>
            <div class="category">${product.category}</div>
          </div>
          <img src="${barcodeImageUrl}" alt="Barcode: ${product.barcode}" class="barcode-image" />
          <div class="barcode-number">${product.barcode}</div>
          <div class="stock-info">Stock: ${product.stocks} units</div>
        </div>
      `;
    }).join('');

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
            <p>Total Products: ${products.length} | Generated: ${new Date().toLocaleString()}</p>
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Products</h1>
              <p className="text-gray-600 mt-1">Manage your inventory products</p>
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Search Products</label>
              <input
                type="text"
                placeholder="Search by brand, barcode, description, category, or stocks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="md:w-48">
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat === 'all' ? 'All Categories' : cat}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Barcode</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Brand</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Stocks</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Barcode Number</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Last Updated</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.map(product => (
                  <tr key={product._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      {barcodeImages[product._id] ? (
                        <img 
                          src={barcodeImages[product._id]} 
                          alt={`Barcode: ${product.barcode}`} 
                          className="max-w-full h-auto" 
                          onError={(e) => {
                            console.error('❌ Failed to load barcode image for product:', product._id);
                            e.currentTarget.style.display = 'none';
                            // Try to regenerate the barcode
                            generateSingleBarcode(product);
                          }}
                        />
                      ) : (
                        <div className="flex items-center justify-center h-12 w-32 bg-gray-100 rounded">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div 
                        className="text-sm font-medium text-blue-700 cursor-pointer hover:underline"
                        onClick={() => {
                          setSelectedProduct(product);
                          setShowDetails(true);
                        }}
                      >
                        {product.brand}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{product.description}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{product.category}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{product.stocks}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{product.barcode}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{product.lastUpdated}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleOpenEditModal(product)}
                          className="text-blue-600 hover:text-blue-900 bg-blue-100 hover:bg-blue-200 px-2 py-1 rounded text-xs font-medium transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handlePrintBarcode(product)}
                          className="text-green-600 hover:text-green-900 bg-green-100 hover:bg-green-200 px-2 py-1 rounded text-xs font-medium transition-colors"
                          title="Print Barcode Label"
                        >
                          🖨️
                        </button>
                        <button
                          onClick={() => handleOpenDeleteModal(product)}
                          className="text-red-600 hover:text-red-900 bg-red-100 hover:bg-red-200 px-2 py-1 rounded text-xs font-medium transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-4 text-sm text-gray-600">
          Showing {filteredProducts.length} of {products.length} products
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
        product={selectedProduct}
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
    </div>
  );
}
