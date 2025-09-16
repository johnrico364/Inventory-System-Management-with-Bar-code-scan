'use client';

import { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';
import { useDarkMode } from '../../context/DarkModeContext';

interface ProductDetailsProps {
  product: {
    _id: string;
    brand: string;
    barcode: number;
    description: string;
    category: string;
    stocks: number;
    status: 'in-stock' | 'low-stock' | 'out-of-stock';
    lastUpdated: string;
  };
  isOpen: boolean;
  onClose: () => void;
}

export default function ProductDetails({ product, isOpen, onClose }: ProductDetailsProps) {
  const barcodeRef = useRef<SVGSVGElement>(null);
  const { darkMode } = useDarkMode();

  useEffect(() => {
    if (isOpen && barcodeRef.current) {
      console.log('🎨 Generating barcode for ProductDetails:', {
        productId: product._id,
        barcodeValue: product.barcode,
        elementFound: barcodeRef.current ? 'Yes' : 'No'
      });
      
      try {
        // Create canvas for barcode image
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 300;
        canvas.height = 100;
        
        // Generate barcode on canvas
        JsBarcode(canvas, product.barcode.toString(), {
          format: 'CODE128',
          width: 3,
          height: 80,
          displayValue: true,
          fontSize: 16,
          margin: 10
        });
        
        // Convert canvas to image
        const img = document.createElement('img');
        img.src = canvas.toDataURL();
        img.alt = `Barcode: ${product.barcode}`;
        img.className = 'max-w-full h-auto';
        
        // Clear existing content and add image
        barcodeRef.current.innerHTML = '';
        barcodeRef.current.appendChild(img);
        
        console.log('✅ ProductDetails barcode generated successfully');
      } catch (error) {
        console.error('❌ Error generating ProductDetails barcode:', error);
      }
    }
  }, [isOpen, product.barcode]);

  if (!isOpen) return null;

  const getStatusColor = (status: string) => {
    if (darkMode) {
      switch (status) {
        case 'in-stock': return 'bg-green-900/20 text-green-400';
        case 'low-stock': return 'bg-orange-900/20 text-orange-400';
        case 'out-of-stock': return 'bg-red-900/20 text-red-400';
        default: return 'bg-gray-900/20 text-gray-400';
      }
    } else {
      switch (status) {
        case 'in-stock': return 'bg-green-100 text-green-800';
        case 'low-stock': return 'bg-orange-100 text-orange-800';
        case 'out-of-stock': return 'bg-red-100 text-red-800';
        default: return 'bg-gray-100 text-gray-800';
      }
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

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className={`relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md ${
        darkMode ? 'bg-gray-800 text-white' : 'bg-white'
      }`}>
        <div className="mt-3">
          <div className="flex justify-between items-center mb-6">
            <h3 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Product Details</h3>
            <button
              onClick={onClose}
              className={`text-2xl ${darkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
            >
              ✕
            </button>
          </div>
          <div className="space-y-6">
            {/* Product Header */}
            <div className={`${darkMode ? 'bg-gray-900/50' : 'bg-gray-50'} p-4 rounded-lg`}>
              <h5 className={`text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Barcode</h5>
              <div className={`flex items-center justify-center p-4 rounded border ${
                darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}>
                <svg ref={barcodeRef} className={darkMode ? 'invert' : ''}></svg>
              </div>
              <p className={`text-xs mt-2 text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Barcode: {product.barcode}
              </p>
            </div>
            <div className={`border-b pb-4 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <h4 className={`text-xl font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {product.brand}
              </h4>
              <p className={darkMode ? 'text-gray-300' : 'text-gray-600'}>
                {product.description}
              </p>
            </div>
            
            {/* Product Information Grid */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h5 className={`text-sm font-medium mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Basic Information
                </h5>
                <div className="space-y-3">
                  <div>
                    <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Category</span>
                    <p className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                      {product.category}
                    </p>
                  </div>
                  <div>
                    <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Brand</span>
                    <p className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                      {product.brand}
                    </p>
                  </div>
                  <div>
                    <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Stock Level</span>
                    <p className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                      {product.stocks} units
                    </p>
                  </div>
                </div>
              </div>
              <div>
                <h5 className={`text-sm font-medium mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Status & Tracking
                </h5>
                <div className="space-y-3">
                  <div>
                    <span className="text-xs text-gray-500">Status</span>
                    <div className="mt-1">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(product.status)}`}>
                        {getStatusText(product.status)}
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Barcode</span>
                    <p className="text-sm font-medium text-gray-900">{product.barcode}</p>
                  </div>
                  <div>
                    <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Last Updated</span>
                    <p className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>{product.lastUpdated}</p>
                  </div>
                </div>
              </div>
            </div>
            {/* Stock Alerts */}
            {product.stocks <= 5 && (
              <div className={`${darkMode ? 'bg-orange-900/20 border-orange-800' : 'bg-orange-50 border-orange-200'} border rounded-lg p-4`}>
                <div className="flex">
                  <div className="flex-shrink-0">
                    <span className="text-orange-400">⚠️</span>
                  </div>
                  <div className="ml-3">
                    <h3 className={`text-sm font-medium ${darkMode ? 'text-orange-400' : 'text-orange-800'}`}>Low Stock Alert</h3>
                    <div className={`mt-2 text-sm ${darkMode ? 'text-orange-300' : 'text-orange-700'}`}>
                      <p>This product is running low on stock. Consider reordering soon.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {/* Action Buttons */}
            <div className={`flex justify-end space-x-3 pt-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <button
                onClick={onClose}
                className={`px-4 py-2 text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  darkMode 
                    ? 'text-gray-300 bg-gray-800 border-gray-700 hover:bg-gray-700 focus:ring-gray-600' 
                    : 'text-gray-700 bg-gray-100 border-gray-300 hover:bg-gray-200 focus:ring-gray-500'
                }`}
              >
                Close
              </button>
              <button
                className={`px-4 py-2 text-sm font-medium text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  darkMode
                    ? 'bg-blue-700 hover:bg-blue-800 focus:ring-blue-600'
                    : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
                }`}
              >
                Edit Product
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
