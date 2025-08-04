'use client';

import { useState, useEffect } from 'react';
import JsBarcode from 'jsbarcode';
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

  // Generate random barcode
  const generateBarcode = () => {
    return Date.now(); // Returns timestamp as barcode number
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

  // Generate barcodes for products dynamically
  const generateBarcodes = () => {
    console.log('🎨 Starting barcode generation for', products.length, 'products');
    
    products.forEach((product, index) => {
      const barcodeId = `barcode-${product._id}`;
      const headerId = `header-barcode`;

      const barcodeEl = document.getElementById(barcodeId);
      const headerEl = product._id === products[0]?._id ? document.getElementById(headerId) : null;

      console.log(`📊 Generating barcode ${index + 1}/${products.length}:`, {
        productId: product._id,
        barcodeValue: product.barcode,
        barcodeElement: barcodeEl ? 'Found' : 'Not found',
        headerElement: headerEl ? 'Found' : 'Not found'
      });

      if (barcodeEl) {
        try {
          // Create canvas for barcode image
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = 200;
          canvas.height = 60;
          
          // Generate barcode on canvas
          JsBarcode(canvas, product.barcode.toString(), {
            format: 'CODE128',
            width: 2,
            height: 50,
            displayValue: true,
            fontSize: 12,
            margin: 5
          });
          
          // Convert canvas to image
          const img = document.createElement('img');
          img.src = canvas.toDataURL();
          img.alt = `Barcode: ${product.barcode}`;
          img.className = 'max-w-full h-auto';
          
          // Clear existing content and add image
          barcodeEl.innerHTML = '';
          barcodeEl.appendChild(img);
          
          console.log(`✅ Barcode generated successfully for product ${product._id}`);
        } catch (error) {
          console.error('❌ Error generating barcode for product:', product.barcode, error);
        }
      } else {
        console.warn(`⚠️ Barcode element not found for product ${product._id}`);
      }

      if (headerEl) {
        try {
          // Create canvas for header barcode image
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = 250;
          canvas.height = 80;
          
          // Generate barcode on canvas
          JsBarcode(canvas, product.barcode.toString(), {
            format: 'CODE128',
            width: 2,
            height: 70,
            displayValue: true,
            fontSize: 14,
            margin: 8
          });
          
          // Convert canvas to image
          const img = document.createElement('img');
          img.src = canvas.toDataURL();
          img.alt = `Header Barcode: ${product.barcode}`;
          img.className = 'max-w-full h-auto';
          
          // Clear existing content and add image
          headerEl.innerHTML = '';
          headerEl.appendChild(img);
          
          console.log(`✅ Header barcode generated successfully`);
        } catch (error) {
          console.error('❌ Error generating header barcode:', error);
        }
      }
    });
    
    console.log('🎨 Barcode generation completed');
  };

  // Generate barcodes whenever products change
  useEffect(() => {
    if (products.length > 0) {
      // Small delay to ensure DOM elements are rendered
      setTimeout(() => {
        generateBarcodes();
      }, 100);
    }
  }, [products]);

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.barcode.toString().includes(searchTerm.toLowerCase());
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

  const handleProductAdded = () => {
    fetchProducts(); // Refresh the products list
  };

  const handleProductUpdated = () => {
    fetchProducts(); // Refresh the products list
  };

  const handleProductDeleted = () => {
    fetchProducts(); // Refresh the products list
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
              {products.length > 0 && (
                <div className="mt-4">
                  <svg id="header-barcode"></svg>
                </div>
              )}
            </div>
            <button
              onClick={handleOpenAddModal}
              className="mt-4 sm:mt-0 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              + Add Product
            </button>
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
                placeholder="Search by brand or barcode..."
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
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Product</th>
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
                      <svg id={`barcode-${product._id}`}></svg>
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
                      <div className="text-sm text-gray-500">{product.description}</div>
                    </td>
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
