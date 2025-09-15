'use client';

import { useState } from 'react';
import { useDarkMode } from '../../context/DarkModeContext';

interface StockOutModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: any;
  onStockUpdated: () => void;
}

export default function StockOutModal({ isOpen, onClose, product, onStockUpdated }: StockOutModalProps) {
  const [quantity, setQuantity] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { darkMode } = useDarkMode();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate that stock out quantity doesn't exceed current stock
      console.log('Attempting to update stock:', {
        productId: product._id,
        quantity: parseInt(quantity),
        currentStock: product.stocks
      });

      if (parseInt(quantity) > product.stocks) {
        throw new Error('Stock out quantity cannot exceed current stock');
      }

      const response = await fetch(`https://mom-inventory.vercel.app/api/products/update/${product._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'Stock out',
          quantity: parseInt(quantity)
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('Stock update failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        throw new Error(errorData?.message || 'Failed to update stock');
      }

      const result = await response.json();
      console.log('Stock updated successfully:', result);

      onStockUpdated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update stock. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleClose = () => {
    setQuantity('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
      <div
        className={`w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl rounded-2xl border-2 ${
          darkMode ? "bg-gray-800 border-blue-800" : "bg-white border-blue-200"
        }`}
      >
        {/* Header */}
        <div className={`px-6 py-4 rounded-t-2xl ${
          darkMode 
            ? "bg-gradient-to-r from-red-950 via-red-900 to-red-800" 
            : "bg-gradient-to-r from-red-900 via-red-800 to-red-700"
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-1.5 h-6 bg-red-400 rounded-r-lg"></div>
              <h3 className="text-xl font-extrabold text-white tracking-tight drop-shadow-lg">
                Stock Out - {product.brand}
              </h3>
            </div>
            <button
              onClick={handleClose}
              className="text-white hover:text-red-200 transition-colors p-2 rounded-lg border border-red-600 hover:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-400"
            >
              ✕
            </button>
          </div>
        </div>
        
        <div className="p-6">
          {/* Product Info */}
          <div className="mb-6 space-y-2">
            <p className={`text-sm font-medium ${
              darkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              <span className="font-semibold">Description:</span> {product.description || 'No description available'}
            </p>
            <p className={`text-sm font-medium ${
              darkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              <span className="font-semibold">Category:</span> {product.category || 'Uncategorized'}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className={`block text-sm font-medium mb-2 ${
                darkMode ? 'text-gray-200' : 'text-gray-700'
              }`}>
                Current Stock: <span className={`font-bold text-lg ${
                  darkMode ? 'text-red-400' : 'text-red-600'
                }`}>{product.stocks}</span>
              </label>
              <label className={`block text-sm font-medium mb-2 ${
                darkMode ? 'text-white' : 'text-gray-700'
              }`}>
                Quantity to Remove *
              </label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                min="1"
                max={product.stocks}
                required
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
                placeholder="Enter quantity to remove"
              />
              {quantity && parseInt(quantity) > product.stocks && (
                <p className="text-red-500 text-xs mt-1">
                  Quantity cannot exceed current stock ({product.stocks})
                </p>
              )}
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className={`px-6 py-3 text-sm font-semibold border-2 rounded-xl transition-colors focus:outline-none focus:ring-4 focus:ring-offset-2 ${
                  darkMode
                    ? "text-gray-300 bg-gray-700 border-gray-600 hover:bg-gray-600 focus:ring-gray-500"
                    : "text-gray-700 bg-gray-100 border-gray-300 hover:bg-gray-200 focus:ring-gray-400"
                }`}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !quantity || parseInt(quantity) > product.stocks}
                className="px-6 py-3 text-sm font-semibold text-white bg-red-700 border-2 border-red-800 rounded-xl hover:bg-red-800 transition-colors focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Updating...' : 'Confirm Stock Out'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
