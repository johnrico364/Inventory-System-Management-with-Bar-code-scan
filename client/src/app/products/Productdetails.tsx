'use client';

import { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

interface ProductDetailsProps {
  product: {
    id: string;
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

  useEffect(() => {
    if (isOpen && barcodeRef.current) {
      JsBarcode(barcodeRef.current, product.barcode.toString(), {
        format: 'CODE128',
        width: 2,
        height: 60,
        displayValue: true,
        fontSize: 12,
        margin: 5
      });
    }
  }, [isOpen, product.barcode]);

  if (!isOpen) return null;

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

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold text-gray-900">Product Details</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ✕
            </button>
          </div>
          <div className="space-y-6">
            {/* Product Header */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h5 className="text-sm font-medium text-gray-700 mb-2">Barcode</h5>
              <div className="flex items-center justify-center bg-white p-4 rounded border">
                <svg ref={barcodeRef}></svg>
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">Barcode: {product.barcode}</p>
            </div>
            <div className="border-b border-gray-200 pb-4">
              <h4 className="text-xl font-semibold text-gray-900 mb-2">{product.brand}</h4>
              <p className="text-gray-600">{product.description}</p>
            </div>
            
            {/* Product Information Grid */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-3">Basic Information</h5>
                <div className="space-y-3">
                  <div>
                    <span className="text-xs text-gray-500">Category</span>
                    <p className="text-sm font-medium text-gray-900">{product.category}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Brand</span>
                    <p className="text-sm font-medium text-gray-900">{product.brand}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Stock Level</span>
                    <p className="text-sm font-medium text-gray-900">{product.stocks} units</p>
                  </div>
                </div>
              </div>
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-3">Status & Tracking</h5>
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
                    <span className="text-xs text-gray-500">Last Updated</span>
                    <p className="text-sm font-medium text-gray-900">{product.lastUpdated}</p>
                  </div>
                </div>
              </div>
            </div>
            {/* Stock Alerts */}
            {product.stocks <= 5 && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <span className="text-orange-400">⚠️</span>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-orange-800">Low Stock Alert</h3>
                    <div className="mt-2 text-sm text-orange-700">
                      <p>This product is running low on stock. Consider reordering soon.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Close
              </button>
              <button
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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
