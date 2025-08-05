'use client';

import { useState, useEffect } from 'react';
import JsBarcode from 'jsbarcode';

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
  const [archivedProducts, setArchivedProducts] = useState<ArchivedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [error, setError] = useState('');

  // Fetch archived products from API
  const fetchArchivedProducts = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('📡 Fetching archived products from API...');
      const response = await fetch('http://localhost:4000/api/products/archived');
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
    fetchArchivedProducts();
  }, []);

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
    if (archivedProducts.length > 0) {
      // Small delay to ensure DOM elements are rendered
      setTimeout(() => {
        generateBarcodes();
      }, 100);
    }
  }, [archivedProducts]);

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
      const response = await fetch(`http://localhost:4000/api/products/restore/${productId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      console.log('✅ Product restored successfully');
      fetchArchivedProducts(); // Refresh the list
    } catch (err) {
      console.error('❌ Error restoring product:', err);
      setError('Failed to restore product. Please try again.');
    }
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
              <h1 className="text-3xl font-bold text-gray-900">Archived Products</h1>
              <p className="text-gray-600 mt-1">View and restore deleted products</p>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Search Archived Products</label>
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

        {/* Archived Products Table */}
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
                {filteredArchivedProducts.map(product => (
                  <tr key={product._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div id={`archived-barcode-${product._id}`}></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{product.brand}</div>
                      <div className="text-sm text-gray-500">{product.description}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{product.category}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{product.stocks}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{product.barcode}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{product.lastUpdated}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <button
                        onClick={() => handleRestoreProduct(product._id)}
                        className="text-green-600 hover:text-green-900 bg-green-100 hover:bg-green-200 px-2 py-1 rounded text-xs font-medium transition-colors"
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

        <div className="mt-4 text-sm text-gray-600">
          Showing {filteredArchivedProducts.length} of {archivedProducts.length} archived products
        </div>
      </div>
    </div>
  );
}
