'use client';

import { useState, useEffect } from 'react';
import JsBarcode from 'jsbarcode';
import { useDarkMode } from '../context/DarkModeContext';

interface ArchivedProduct {
  _id: string;
  brand: string;
  barcode: number;
  description: string;
  category: string;
  stocks: number;
  status: 'in-stock' | 'low-stock' | 'out-of-stock';
  lastUpdated: string;
  isDeleted: boolean;
}

export default function ArchivedProducts() {
  const { darkMode } = useDarkMode();  // This must be first
  const [mounted, setMounted] = useState(false);
  const [archivedProducts, setArchivedProducts] = useState<ArchivedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [error, setError] = useState('');

  // Handle client-side hydration
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Fetch archived products from API
  const fetchArchivedProducts = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('📡 Fetching archived products from API...');
      const response = await fetch('https://mom-inventory.vercel.app/api/products/archived');
      console.log('📥 Archived products response:', response.status, response.statusText);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('✅ Archived products fetched successfully:', data);
      setArchivedProducts(data);
    } catch (err) {
      console.error('❌ Error fetching archived products:', err);
      setError('Failed to fetch archived products. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mounted) {
      fetchArchivedProducts();
    }
  }, [mounted]);

  // Generate barcodes for archived products dynamically
  const generateBarcodes = () => {
    console.log('🎨 Starting barcode generation for', archivedProducts.length, 'archived products');
    
    archivedProducts.forEach((product, index) => {
      const barcodeId = `archived-barcode-${product._id}`;

      const barcodeEl = document.getElementById(barcodeId);

      console.log(`📊 Generating archived barcode ${index + 1}/${archivedProducts.length}:`, {
        productId: product._id,
        barcodeValue: product.barcode,
        barcodeElement: barcodeEl ? 'Found' : 'Not found'
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
          
          console.log(`✅ Archived barcode generated successfully for product ${product._id}`);
        } catch (error) {
          console.error('❌ Error generating archived barcode for product:', product.barcode, error);
        }
      } else {
        console.warn(`⚠️ Archived barcode element not found for product ${product._id}`);
      }
    });
    
    console.log('🎨 Archived barcode generation completed');
  };

  // Generate barcodes whenever archived products change
  useEffect(() => {
    if (mounted && archivedProducts.length > 0) {
      const timer = setTimeout(generateBarcodes, 100);
      return () => clearTimeout(timer);
    }
  }, [mounted, archivedProducts]);

  const filteredArchivedProducts = archivedProducts.filter(product => {
    const matchesSearch = product.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.barcode.toString().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['all', ...Array.from(new Set(archivedProducts.map(p => p.category)))];

  const handleRestoreProduct = async (productId: string) => {
    console.log('🔄 Restoring product:', productId);
    
    try {
      const response = await fetch(`https://mom-inventory.vercel.app/api/products/restore/${productId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      console.log(response)

      console.log('✅ Product restored successfully');
      fetchArchivedProducts(); // Refresh the list
    } catch (err) {
      console.error('❌ Error restoring product:', err);
      setError('Failed to restore product. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-blue-800' : 'bg-gray-50'}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className={darkMode ? "min-h-screen bg-gray-900 text-white" : "min-h-screen bg-white"}>
      {/* Header */}
      <div className={darkMode ? "bg-gradient-to-r from-blue-950 via-blue-900 to-blue-800 shadow-lg border-b border-blue-950" : "bg-gradient-to-r from-blue-900 via-blue-800 to-blue-700 shadow-lg border-b border-blue-900"}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-white">Archived Products</h1>
              <p className={darkMode ? "text-blue-200 mt-1" : "text-blue-100 mt-1"}>View and restore deleted products</p>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className={`border px-4 py-3 rounded ${
            darkMode
              ? 'bg-red-900/20 border-red-800 text-red-400'
              : 'bg-red-100 border-red-400 text-red-700'
          }`}>
            {error}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className={`rounded-lg shadow-sm p-6 mb-6 ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        } border`}>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className={`block text-sm font-medium mb-2 ${
                darkMode ? 'text-gray-200' : 'text-gray-700'
              }`}>Search Archived Products</label>
              <input
                type="text"
                placeholder="Search by brand or barcode..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg focus:ring-blue-500 focus:border-blue-500 ${
                  darkMode
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
              />
            </div>
            <div className="md:w-48">
              <label className={`block text-sm font-medium mb-2 ${
                darkMode ? 'text-gray-200' : 'text-gray-700'
              }`}>Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg focus:ring-blue-500 focus:border-blue-500 ${
                  darkMode
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
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

        {/* Archived Products Table */}
        <div className={`rounded-lg shadow-sm overflow-hidden ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        } border`}>
          <div className="overflow-x-auto">
            <table className={`min-w-full ${darkMode ? 'divide-gray-700' : 'divide-gray-200'} divide-y`}>
              <thead className={darkMode ? 'bg-gray-900' : 'bg-gray-50'}>
                <tr>
                  <th className={`px-6 py-3 text-left text-xs font-semibold uppercase ${
                    darkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>Barcode</th>
                  <th className={`px-6 py-3 text-left text-xs font-semibold uppercase ${
                    darkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>Product</th>
                  <th className={`px-6 py-3 text-left text-xs font-semibold uppercase ${
                    darkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>Category</th>
                  <th className={`px-6 py-3 text-left text-xs font-semibold uppercase ${
                    darkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>Stocks</th>
                  <th className={`px-6 py-3 text-left text-xs font-semibold uppercase ${
                    darkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>Barcode Number</th>
                  
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className={`${darkMode ? 'bg-gray-800' : 'bg-white'} divide-y ${
                darkMode ? 'divide-gray-700' : 'divide-gray-200'
              }`}>
                {filteredArchivedProducts.map(product => (
                  <tr key={product._id} className={darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                    <td className="px-6 py-4">
                      <div id={`archived-barcode-${product._id}`}></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`text-sm font-medium ${
                        darkMode ? 'text-white' : 'text-gray-900'
                      }`}>{product.brand}</div>
                      <div className={`text-sm ${
                        darkMode ? 'text-gray-300' : 'text-gray-500'
                      }`}>{product.description}</div>
                    </td>
                    <td className={`px-6 py-4 text-sm ${
                      darkMode ? 'text-gray-200' : 'text-gray-900'
                    }`}>{product.category}</td>
                    <td className={`px-6 py-4 text-sm ${
                      darkMode ? 'text-gray-200' : 'text-gray-900'
                    }`}>{product.stocks}</td>
                    <td className={`px-6 py-4 text-sm ${
                      darkMode ? 'text-gray-200' : 'text-gray-900'
                    }`}>{product.barcode}</td>
                    
                    <td className="px-6 py-4 text-sm">
                      <button
                        onClick={() => handleRestoreProduct(product._id)}
                        className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                          darkMode
                            ? 'text-green-400 hover:text-green-300 bg-green-900/20 hover:bg-green-900/30'
                            : 'text-green-600 hover:text-green-900 bg-green-100 hover:bg-green-200'
                        }`}
                      >
                        Restore
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className={`mt-4 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          Showing {filteredArchivedProducts.length} of {archivedProducts.length} archived products
        </div>
      </div>
    </div>
  );
}
