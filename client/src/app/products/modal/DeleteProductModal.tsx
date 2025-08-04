'use client';

import { useState } from 'react';

interface DeleteProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductDeleted: () => void;
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

export default function DeleteProductModal({ isOpen, onClose, onProductDeleted, product }: DeleteProductModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    console.log('🚀 Starting soft delete process...');
    console.log('📋 Product to archive:', product);
    
    if (!product) return;
    
    setLoading(true);
    setError('');

    console.log('🌐 API endpoint: http://localhost:4000/api/products/delete/' + product._id);

    try {
      console.log('📡 Making soft delete API request...');
      console.log('📤 Request details:', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await fetch(`http://localhost:4000/api/products/delete/${product._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isDeleted: true })
      });

      console.log('📥 Soft delete response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Soft delete response not OK:', {
          status: response.status,
          statusText: response.statusText,
          errorText: errorText
        });
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Product archived successfully:', result);
      console.log('🎉 Soft delete API call completed successfully');
      
      console.log('🔄 Calling onProductDeleted...');
      onProductDeleted();
      onClose();
    } catch (err) {
      console.error('💥 Soft delete error details:', {
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
      
      setError('Failed to archive product. Please try again.');
      console.error('❌ Error archiving product:', err);
    } finally {
      console.log('🏁 Soft delete process completed, setting loading to false');
      setLoading(false);
    }
  };

  const handleClose = () => {
    console.log('🚪 Closing delete modal...');
    setError('');
    onClose();
  };

  if (!isOpen || !product) return null;

  console.log('🎨 Rendering DeleteProductModal with state:', {
    loading,
    error,
    isOpen,
    product
  });

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Archive Product</h3>
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
          
          <div className="mb-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Are you sure you want to archive this product?
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>This product will be moved to the archived section. You can restore it later from the archived products page.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Product Details:</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p><span className="font-medium">Brand:</span> {product.brand}</p>
                <p><span className="font-medium">Barcode:</span> {product.barcode}</p>
                <p><span className="font-medium">Category:</span> {product.category}</p>
                <p><span className="font-medium">Stocks:</span> {product.stocks}</p>
                <p><span className="font-medium">Description:</span> {product.description}</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Archiving...' : 'Archive Product'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
