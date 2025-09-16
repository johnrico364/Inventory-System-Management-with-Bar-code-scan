"use client";

import { useState, useEffect } from "react";
import { useDarkMode } from "../../../context/DarkModeContext";

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
    boxColor: string;
    boxNumber: string;
    status: "in-stock" | "low-stock" | "out-of-stock";
    lastUpdated: string;
  } | null;
}

interface FormData {
  brand: string;
  barcode: string;
  description: string;
  category: string;
  stocks: string;
  boxColor: string;
  boxNumber: string;
}

export default function EditProductModal({
  isOpen,
  onClose,
  onProductUpdated,
  product,
}: EditProductModalProps) {
  const { darkMode } = useDarkMode();
  const [formData, setFormData] = useState<FormData>({
    brand: "",
    barcode: "",
    description: "",
    category: "",
    stocks: "",
    boxColor: "",
    boxNumber: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState<{
    [key: string]: string;
  }>({});
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Update form data when product changes
  useEffect(() => {
    if (product) {
      setFormData({
        brand: product.brand,
        barcode: product.barcode.toString(),
        description: product.description,
        category: product.category,
        stocks: product.stocks.toString(),
        boxColor: product.boxColor || "",
        boxNumber: product.boxNumber || "",
      });
    }
  }, [product]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    console.log(
      "📝 Edit form field changed:",
      e.target.name,
      "=",
      e.target.value
    );
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value,
    });

    // Clear validation error for this field when user starts typing
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const errors: { [key: string]: string } = {};

    // Brand validation
    if (!formData.brand.trim()) {
      errors.brand = "Brand name is required";
    } else if (formData.brand.trim().length < 2) {
      errors.brand = "Brand name must be at least 2 characters long";
    } else if (formData.brand.trim().length > 50) {
      errors.brand = "Brand name must be less than 50 characters";
    }

    // Barcode validation
    if (!formData.barcode) {
      errors.barcode = "Barcode is required";
    } else if (isNaN(Number(formData.barcode))) {
      errors.barcode = "Barcode must be a valid number";
    } else if (Number(formData.barcode) <= 0) {
      errors.barcode = "Barcode must be a positive number";
    }

    // Category validation
    if (!formData.category) {
      errors.category = "Category is required";
    }

    // Stocks validation
    if (!formData.stocks) {
      errors.stocks = "Stock quantity is required";
    } else if (isNaN(Number(formData.stocks))) {
      errors.stocks = "Stock quantity must be a valid number";
    } else if (Number(formData.stocks) < 0) {
      errors.stocks = "Stock quantity cannot be negative";
    } else if (Number(formData.stocks) > 999999) {
      errors.stocks = "Stock quantity cannot exceed 999,999";
    }

    // Description validation (optional but if provided, validate length)
    if (formData.description && formData.description.trim().length > 500) {
      errors.description = "Description must be less than 500 characters";
    }

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("🚀 Starting edit form submission...");
    console.log("📋 Current form data:", formData);
    console.log("📋 Product object:", product);

    if (!product) {
      setError("No product selected for editing.");
      return;
    }

    if (!product._id) {
      setError("Product ID is missing. Cannot update product.");
      return;
    }

    // Validate form before submission
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      console.log("❌ Validation errors:", errors);
      return;
    }

    // Show confirmation dialog instead of submitting immediately
    setShowConfirmation(true);
  };

  const handleConfirmSubmit = async () => {
    console.log("✅ User confirmed edit submission, proceeding...");
    setShowConfirmation(false);
    setLoading(true);
    setError("");
    setValidationErrors({});

    // Calculate the previous stock value
    const previousStocks = product!.stocks;
    const newStocks = parseInt(formData.stocks);

    // Prepare the request payload
    const payload = {
      brand: formData.brand,
      barcode: parseInt(formData.barcode),
      description: formData.description,
      category: formData.category,
      stocks: newStocks,
      boxColor: formData.boxColor,
      boxNumber: formData.boxNumber,
      action:
        newStocks > previousStocks
          ? "Stock In"
          : newStocks < previousStocks
          ? "Stock Out"
          : "Product update",
    };

    console.log("📦 Edit request payload:", payload);

    try {
      const response = await fetch(
        `https://mom-inventory.vercel.app/api/products/update/${product!._id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      console.log("📥 Edit response received:", {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries()),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Edit response not OK:", {
          status: response.status,
          statusText: response.statusText,
          errorText: errorText,
        });
        throw new Error(
          `HTTP ${response.status}: ${response.statusText} - ${errorText}`
        );
      }

      const result = await response.json();
      console.log("✅ Product updated successfully:", result);
      onProductUpdated();
      onClose();
    } catch (err) {

      if (
        err instanceof TypeError &&
        (err as Error).message.includes("Failed to fetch")
      ) {
        console.error("🔌 Network Error - Possible causes:");
        console.error("   - Server not running on mom-inventory.vercel.app");
        console.error("   - CORS issues");
        console.error("   - Network connectivity problems");
        console.error("   - Firewall blocking the request");
      }

      setError("Failed to update product. Please try again.");
      console.error("❌ Error updating product:", err);
    } finally {
      console.log(
        "🏁 Edit form submission completed, setting loading to false"
      );
      setLoading(false);
    }
  };

  const handleClose = () => {
    console.log("🚪 Closing edit modal, resetting form...");
    setError("");
    setValidationErrors({});
    setShowConfirmation(false);
    onClose();
  };

  // Check if form is valid for enabling submit button
  const isFormValid = () => {
    return (
      formData.brand.trim() &&
      formData.barcode &&
      formData.category &&
      formData.stocks &&
      Object.keys(validationErrors).length === 0
    );
  };

  if (!isOpen || !product) return null;

  console.log("🎨 Rendering EditProductModal with state:", {
    loading,
    error,
    formData,
    isOpen,
    product,
  });

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
      {showConfirmation ? (
        // Confirmation Dialog
        <div
          className={`w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl rounded-2xl border-2 ${
            darkMode ? "bg-gray-800 border-blue-800" : "bg-white border-blue-200"
          }`}
        >
          {/* Header */}
          <div className={`px-6 py-4 rounded-t-2xl ${
            darkMode 
              ? "bg-gradient-to-r from-blue-950 via-blue-900 to-blue-800" 
              : "bg-gradient-to-r from-blue-900 via-blue-800 to-blue-700"
          }`}>
            <div className="flex items-center space-x-3">
              <div className="w-1.5 h-6 bg-blue-400 rounded-r-lg"></div>
              <h3 className="text-xl font-extrabold text-white tracking-tight drop-shadow-lg">
                Confirm Product Changes
              </h3>
            </div>
          </div>
          
          <div className="p-6">
            <div className="text-left space-y-3 mb-6">
              <div>
                <span
                  className={`font-medium ${
                    darkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Brand:
                </span>
                <span
                  className={`ml-2 ${
                    darkMode ? "text-gray-100" : "text-gray-900"
                  }`}
                >
                  {formData.brand}
                </span>
              </div>
              <div>
                <span
                  className={`font-medium ${
                    darkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Barcode:
                </span>
                <span
                  className={`ml-2 ${
                    darkMode ? "text-gray-100" : "text-gray-900"
                  }`}
                >
                  {formData.barcode}
                </span>
              </div>
              <div>
                <span
                  className={`font-medium ${
                    darkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Category:
                </span>
                <span
                  className={`ml-2 ${
                    darkMode ? "text-gray-100" : "text-gray-900"
                  } capitalize`}
                >
                  {formData.category}
                </span>
              </div>
              {formData.description && (
                <div>
                  <span
                    className={`font-medium ${
                      darkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Description:
                  </span>
                  <span
                    className={`ml-2 ${
                      darkMode ? "text-gray-100" : "text-gray-900"
                    }`}
                  >
                    {formData.description}
                  </span>
                </div>
              )}
              <div>
                <span
                  className={`font-medium ${
                    darkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Box Color:
                </span>
                <span
                  className={`ml-2 ${
                    darkMode ? "text-gray-100" : "text-gray-900"
                  }`}
                >
                  {formData.boxColor}
                </span>
              </div>
              <div>
                <span
                  className={`font-medium ${
                    darkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Box Number:
                </span>
                <span
                  className={`ml-2 ${
                    darkMode ? "text-gray-100" : "text-gray-900"
                  }`}
                >
                  {formData.boxNumber}
                </span>
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
                Back to Edit
              </button>
              <button
                type="button"
                onClick={handleConfirmSubmit}
                className="px-6 py-3 text-sm font-semibold text-white bg-green-700 border-2 border-green-800 rounded-xl hover:bg-green-800 transition-colors focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-green-500"
              >
                Confirm & Update
              </button>
            </div>
          </div>
        </div>
      ) : (
        // Main Form
        <div
          className={`w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl rounded-2xl border-2 ${
            darkMode ? "bg-gray-800 border-blue-800" : "bg-white border-blue-200"
          }`}
        >
          {/* Header */}
          <div className={`px-6 py-4 rounded-t-2xl ${
            darkMode 
              ? "bg-gradient-to-r from-blue-950 via-blue-900 to-blue-800" 
              : "bg-gradient-to-r from-blue-900 via-blue-800 to-blue-700"
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-1.5 h-6 bg-blue-400 rounded-r-lg"></div>
                <h3 className="text-xl font-extrabold text-white tracking-tight drop-shadow-lg">
                  Edit Product
                </h3>
              </div>
              <button
                onClick={handleClose}
                className="text-white hover:text-blue-200 transition-colors p-2 rounded-lg border border-blue-600 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
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

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Category */}
              <div>
                <label
                  className={`block text-sm font-medium mb-1 ${
                    darkMode ? "text-white" : "text-gray-700"
                  }`}
                >
                  Category *
                </label>
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    validationErrors.category
                      ? "border-red-500"
                      : darkMode
                      ? "border-gray-600"
                      : "border-gray-300"
                  } ${
                    darkMode
                      ? "bg-gray-700 text-white placeholder-gray-400"
                      : "bg-white text-gray-900"
                  }`}
                  placeholder="Enter category"
                />
                {validationErrors.category && (
                  <p className="text-red-500 text-xs mt-1">
                    {validationErrors.category}
                  </p>
                )}
              </div>

              {/* Brand */}
              <div>
                <label
                  className={`block text-sm font-medium mb-1 ${
                    darkMode ? "text-white" : "text-gray-700"
                  }`}
                >
                  Brand *
                </label>
                <input
                  type="text"
                  name="brand"
                  value={formData.brand}
                  onChange={handleInputChange}
                  required
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    validationErrors.brand
                      ? "border-red-500"
                      : darkMode
                      ? "border-gray-600"
                      : "border-gray-300"
                  } ${
                    darkMode
                      ? "bg-gray-700 text-white placeholder-gray-400"
                      : "bg-white text-gray-900"
                  }`}
                  placeholder="Enter brand name"
                />
                {validationErrors.brand && (
                  <p className="text-red-500 text-xs mt-1">
                    {validationErrors.brand}
                  </p>
                )}
              </div>

              {/* Description */}
              <div>
                <label
                  className={`block text-sm font-medium mb-1 ${
                    darkMode ? "text-white" : "text-gray-700"
                  }`}
                >
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  maxLength={500}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    validationErrors.description
                      ? "border-red-500"
                      : darkMode
                      ? "border-gray-600"
                      : "border-gray-300"
                  } ${
                    darkMode
                      ? "bg-gray-700 text-white placeholder-gray-400"
                      : "bg-white text-gray-900"
                  }`}
                  placeholder="Enter product description"
                />
                <div className="flex justify-between items-center mt-1">
                  {validationErrors.description && (
                    <p className="text-red-500 text-xs">
                      {validationErrors.description}
                    </p>
                  )}
                  <p className={`text-xs ml-auto ${
                    darkMode ? "text-gray-400" : "text-gray-500"
                  }`}>
                    {formData.description.length}/500 characters
                  </p>
                </div>
              </div>

              {/* Box color */}
              <div>
                <label
                  className={`block text-sm font-medium mb-1 ${
                    darkMode ? "text-white" : "text-gray-700"
                  }`}
                >
                  Box Color *
                </label>
                <select
                  name="boxColor"
                  value={formData.boxColor}
                  onChange={handleInputChange}
                  required
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    validationErrors.boxColor
                      ? "border-red-500"
                      : darkMode
                      ? "border-gray-600"
                      : "border-gray-300"
                  } ${
                    darkMode
                      ? "bg-gray-700 text-white"
                      : "bg-white text-gray-900"
                  }`}
                >
                  <option value="">Select box color</option>
                  <option value="Black">Black</option>
                  <option value="White">White</option>
                </select>
                {validationErrors.boxColor && (
                  <p className="text-red-500 text-xs mt-1">
                    {validationErrors.boxColor}
                  </p>
                )}
              </div>

              <div>
                <label
                  className={`block text-sm font-medium mb-1 ${
                    darkMode ? "text-white" : "text-gray-700"
                  }`}
                >
                  Box Number *
                </label>
                <input
                  type="text"
                  name="boxNumber"
                  value={formData.boxNumber}
                  onChange={handleInputChange}
                  required
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    validationErrors.boxNumber
                      ? "border-red-500"
                      : darkMode
                      ? "border-gray-600"
                      : "border-gray-300"
                  } ${
                    darkMode
                      ? "bg-gray-700 text-white placeholder-gray-400"
                      : "bg-white text-gray-900"
                  }`}
                  placeholder="Enter box number"
                />
                {validationErrors.boxNumber && (
                  <p className="text-red-500 text-xs mt-1">
                    {validationErrors.boxNumber}
                  </p>
                )}
              </div>

              {/* Barcode */}
              <div>
                <label
                  className={`block text-sm font-medium mb-1 ${
                    darkMode ? "text-white" : "text-gray-700"
                  }`}
                >
                  Barcode *
                </label>
                <input
                  type="number"
                  name="barcode"
                  value={formData.barcode}
                  onChange={handleInputChange}
                  required
                  readOnly
                  className={`w-full px-3 py-2 border rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed ${
                    validationErrors.barcode
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                  placeholder="Barcode cannot be edited"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Barcode cannot be modified
                </p>
                {validationErrors.barcode && (
                  <p className="text-red-500 text-xs mt-1">
                    {validationErrors.barcode}
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
                  disabled={loading || !isFormValid()}
                  className="px-6 py-3 text-sm font-semibold text-white bg-blue-800 border-2 border-blue-900 rounded-xl hover:bg-blue-900 transition-colors focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Updating..." : "Update Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
