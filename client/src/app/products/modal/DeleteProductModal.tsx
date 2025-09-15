"use client";

import { useState } from "react";
import { useDarkMode } from "../../context/DarkModeContext";

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
    status: "in-stock" | "low-stock" | "out-of-stock";
    lastUpdated: string;
  } | null;
}

export default function DeleteProductModal({
  isOpen,
  onClose,
  onProductDeleted,
  product,
}: DeleteProductModalProps) {
  const { darkMode } = useDarkMode();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleDelete = async () => {
    console.log("🚀 Starting soft delete process...");
    console.log("📋 Product to archive:", product);

    if (!product) {
      setError("No product selected for archiving.");
      return;
    }

    if (!product._id) {
      setError("Product ID is missing. Cannot archive product.");
      return;
    }

    // Show confirmation dialog instead of deleting immediately
    setShowConfirmation(true);
  };

  const handleConfirmDelete = async () => {
    if (!product || !product._id) {
      setError("Invalid product data. Please try again.");
      setShowConfirmation(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `http://localhost:4000/api/products/archive/${product._id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log(response);
      
      setShowConfirmation(false);
      onProductDeleted();
      onClose();
    } catch (err) {
      console.log( err);
      
      setShowConfirmation(true); // Keep the confirmation dialog open on error
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    console.log("🚪 Closing delete modal...");
    setError("");
    setShowConfirmation(false);
    onClose();
  };

  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
      {showConfirmation ? (
        // Final Confirmation Dialog
        <div
          className={`w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl rounded-2xl border-2 ${
            darkMode ? "bg-gray-800 border-red-800" : "bg-white border-red-200"
          }`}
        >
          {/* Header */}
          <div className={`px-6 py-4 rounded-t-2xl ${
            darkMode 
              ? "bg-gradient-to-r from-red-950 via-red-900 to-red-800" 
              : "bg-gradient-to-r from-red-900 via-red-800 to-red-700"
          }`}>
            <div className="flex items-center space-x-3">
              <div className="w-1.5 h-6 bg-red-400 rounded-r-lg"></div>
              <h3 className="text-xl font-extrabold text-white tracking-tight drop-shadow-lg">
                Final Confirmation
              </h3>
            </div>
          </div>
          
          <div className="p-6">
            <div className="text-center">
              <div className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full mb-4 ${
                darkMode ? "bg-red-900" : "bg-red-100"
              }`}>
                <svg
                  className={`h-6 w-6 ${
                    darkMode ? "text-red-400" : "text-red-600"
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <p className={`text-sm mb-6 ${
                darkMode ? "text-gray-300" : "text-gray-600"
              }`}>
                Are you absolutely sure you want to archive this product? This
                action cannot be undone immediately.
              </p>

              <div className={`border rounded-lg p-4 mb-6 ${
                darkMode 
                  ? "bg-red-950 border-red-800" 
                  : "bg-red-50 border-red-200"
              }`}>
                <h4 className={`text-sm font-medium mb-2 ${
                  darkMode ? "text-red-300" : "text-red-900"
                }`}>
                  Product to Archive:
                </h4>
                <div className={`text-sm space-y-1 ${
                  darkMode ? "text-red-200" : "text-red-800"
                }`}>
                <p>
                  <span className="font-medium">Brand:</span> {product!.brand}
                </p>
                <p>
                  <span className="font-medium">Barcode:</span>{" "}
                  {product!.barcode}
                </p>
                <p>
                  <span className="font-medium">Category:</span>{" "}
                  {product!.category}
                </p>
                <p>
                  <span className="font-medium">Stocks:</span> {product!.stocks}
                </p>
              </div>
            </div>

              <div className="flex justify-center space-x-3">
                <button
                  type="button"
                  onClick={() => setShowConfirmation(false)}
                  className={`px-6 py-3 text-sm font-semibold border-2 rounded-xl transition-colors focus:outline-none focus:ring-4 focus:ring-offset-2 ${
                    darkMode
                      ? "text-gray-300 bg-gray-700 border-gray-600 hover:bg-gray-600 focus:ring-gray-500"
                      : "text-gray-700 bg-gray-100 border-gray-300 hover:bg-gray-200 focus:ring-gray-400"
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="px-6 py-3 text-sm font-semibold text-white bg-red-700 border-2 border-red-800 rounded-xl hover:bg-red-800 transition-colors focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-red-500"
                >
                  Yes, Archive Product
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Main Delete Dialog
        <div
          className={`w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl rounded-2xl border-2 ${
            darkMode ? "bg-gray-800 border-red-800" : "bg-white border-red-200"
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
                  Archive Product
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

            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}

            <div className="mb-6">
              <div className={`border rounded-lg p-4 mb-4 ${
                darkMode 
                  ? "bg-yellow-950 border-yellow-800" 
                  : "bg-yellow-50 border-yellow-200"
              }`}>
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className={`h-5 w-5 ${
                        darkMode ? "text-yellow-300" : "text-yellow-400"
                      }`}
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className={`text-sm font-medium ${
                      darkMode ? "text-yellow-200" : "text-yellow-800"
                    }`}>
                      Are you sure you want to archive this product?
                    </h3>
                    <div className={`mt-2 text-sm ${
                      darkMode ? "text-yellow-300" : "text-yellow-700"
                    }`}>
                      <p>
                        This product will be moved to the archived section. You
                        can restore it later from the archived products page.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className={`rounded-lg p-4 ${
                darkMode ? "bg-gray-700" : "bg-gray-50"
              }`}>
                <h4 className={`text-sm font-medium mb-2 ${
                  darkMode ? "text-white" : "text-gray-900"
                }`}>
                  Product Details:
                </h4>
                <div className={`text-sm space-y-1 ${
                  darkMode ? "text-gray-300" : "text-gray-600"
                }`}>
                  <p>
                    <span className="font-medium">Brand:</span> {product.brand}
                  </p>
                  <p>
                    <span className="font-medium">Barcode:</span>{" "}
                    {product.barcode}
                  </p>
                  <p>
                    <span className="font-medium">Category:</span>{" "}
                    {product.category}
                  </p>
                  <p>
                    <span className="font-medium">Stocks:</span>{" "}
                    {product.stocks}
                  </p>
                  <p>
                    <span className="font-medium">Description:</span>{" "}
                    {product.description}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className={`px-6 py-3 text-sm font-semibold border-2 rounded-xl transition-colors focus:outline-none focus:ring-4 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                  darkMode
                    ? "text-gray-300 bg-gray-700 border-gray-600 hover:bg-gray-600 focus:ring-gray-500"
                    : "text-gray-700 bg-gray-100 border-gray-300 hover:bg-gray-200 focus:ring-gray-400"
                }`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="px-6 py-3 text-sm font-semibold text-white bg-red-700 border-2 border-red-800 rounded-xl hover:bg-red-800 transition-colors focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Archiving..." : "Archive Product"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
