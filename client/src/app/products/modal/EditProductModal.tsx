'use client';

import { useState, useEffect } from 'react';

interface EditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductUpdated: () => void;
  product: {
    _id: string;
    brand: string;
    barcode: number;
    description: string;
    category: string;
    stocks: number;
    status: 'in-stock' | 'low-stock' | 'out-of-stock';
    lastUpdated: string;
  } | null;
}

interface FormData {
  brand: string;
  barcode: string;
  description: string;
  category: string;
  stocks: string;
}

export default function EditProductModal({ isOpen, onClose, onProductUpdated, product }: EditProductModalProps) {
  const [formData, setFormData] = useState<FormData>({
    brand: '',
    barcode: '',
    description: '',
    category: '',
    stocks: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Update form data when product changes
  useEffect(() => {
    if (product) {
      setFormData({
        brand: product.brand,
        barcode: product.barcode.toString(),
        description: product.description,
        category: product.category,
        stocks: product.stocks.toString()
      });
    }
  }, [product]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    console.log('📝 Edit form field changed:', e.target.name, '=', e.target.value);
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🚀 Starting edit form submission...');
    console.log('📋 Current form data:', formData);
    console.log('📋 Product object:', product);
    
    if (!product) {
      setError('No product selected for editing.');
      return;
    }

    if (!product._id) {
      setError('Product ID is missing. Cannot update product.');
      return;
    }
    
    setLoading(true);
    setError('');

    // Prepare the request payload
    const payload = {
      brand: formData.brand,
      barcode: parseInt(formData.barcode),
      description: formData.description,
      category: formData.category,
      stocks: parseInt(formData.stocks)
    };

    console.log('📦 Edit request payload:', payload);
    console.log('🌐 API endpoint: http://localhost:4000/api/products/update/' + product._id);

    try {
      console.log('📡 Making edit API request...');
      console.log('📤 Request details:', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const response = await fetch(`http://localhost:4000/api/products/update/${product._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log('📥 Edit response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Edit response not OK:', {
          status: response.status,
          statusText: response.statusText,
          errorText: errorText
        });
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Product updated successfully:', result);
      console.log('🎉 Edit API call completed successfully');
      
      console.log('🔄 Calling onProductUpdated...');
      onProductUpdated();
      onClose();
    } catch (err) {
      console.error('💥 Edit error details:', {
        name: (err as Error).name,
        message: (err as Error).message,
        stack: (err as Error).stack,
        type: typeof err
      });
      
      if (err instanceof TypeError && (err as Error).message.includes('Failed to fetch')) {
        console.error('🔌 Network Error - Possible causes:');
        console.error('   - Server not running on localhost:4000');
        console.error('   - CORS issues');
        console.error('   - Network connectivity problems');
        console.error('   - Firewall blocking the request');
      }
      
      setError('Failed to update product. Please try again.');
      console.error('❌ Error updating product:', err);
    } finally {
      console.log('🏁 Edit form submission completed, setting loading to false');
      setLoading(false);
    }
  };

  const handleClose = () => {
    console.log('🚪 Closing edit modal, resetting form...');
    setError('');
    onClose();
  };

  if (!isOpen || !product) return null;

  console.log('🎨 Rendering EditProductModal with state:', {
    loading,
    error,
    formData,
    isOpen,
    product
  });

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Edit Product</h3>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Brand *
              </label>
              <input
                type="text"
                name="brand"
                value={formData.brand}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter brand name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Barcode *
              </label>
              <input
                type="number"
                name="barcode"
                value={formData.barcode}
                onChange={handleInputChange}
                required
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                placeholder="Barcode cannot be edited"
              />
              <p className="text-xs text-gray-500 mt-1">Barcode cannot be modified</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select category</option>
                <option value="bearing">Bearing</option>
                <option value="electronics">Electronics</option>
                <option value="clothing">Clothing</option>
                <option value="books">Books</option>
                <option value="home">Home & Garden</option>
                <option value="sports">Sports</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stocks *
              </label>
              <input
                type="number"
                name="stocks"
                value={formData.stocks}
                onChange={handleInputChange}
                required
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter stock quantity"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter product description"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Updating...' : 'Update Product'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
