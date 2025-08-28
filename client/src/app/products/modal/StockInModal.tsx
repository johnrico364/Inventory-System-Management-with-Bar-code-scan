'use client';

import { useState } from 'react';
import { useDarkMode } from '../../context/DarkModeContext';

interface StockInModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: any;
  onStockUpdated: () => void;
}

export default function StockInModal({ isOpen, onClose, product, onStockUpdated }: StockInModalProps) {
  const [quantity, setQuantity] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { darkMode } = useDarkMode();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('Attempting to update stock:', {
        productId: product._id,
        quantity: parseInt(quantity)
      });

      const response = await fetch(`http://localhost:4000/api/products/update/${product._id}`, {
        method: 'PATCH',  // Changed from PUT to PATCH to match server route
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'Stock in',
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
      console.error('Error updating stock:', err);
      setError(err instanceof Error ? err.message : 'Failed to update stock. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 w-96`}>
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className={`text-lg font-medium mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Stock In - {product.brand}
            </h3>
            <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Description: {product.description || 'No description available'}
            </p>
            <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Category: {product.category || 'Uncategorized'}
            </p>
          </div>
          <button
            onClick={onClose}
            className={`${darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-400 hover:text-gray-600'}`}
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
              Current Stock: <span className="font-bold">{product.stocks}</span>
            </label>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
              Quantity to Add
            </label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              min="1"
              required
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent
                ${darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'}`}
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 text-sm font-medium rounded-lg
                ${darkMode
                  ? 'text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600'
                  : 'text-gray-700 hover:text-gray-900 bg-gray-100 hover:bg-gray-200'}`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !quantity}
              className={`px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg
                hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading ? 'Updating...' : 'Confirm Stock In'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
