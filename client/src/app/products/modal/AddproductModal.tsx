"use client";

import { useState } from "react";
import { useDarkMode } from "../../context/DarkModeContext";

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductAdded: (newProduct?: any) => void;
}

interface FormData {
  brand: string;
  boxColor?: string;
  boxNumber?: string;
  barcode: string;
  description: string;
  category: string;
  stocks: string;
}

export default function AddProductModal({
  isOpen,
  onClose,
  onProductAdded,
}: AddProductModalProps) {
  const [formData, setFormData] = useState<FormData>({
    brand: "",
    boxColor: "",
    boxNumber: "",
    barcode: "",
    description: "",
    category: "",
    stocks: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState<{
    [key: string]: string;
  }>({});
  const [showConfirmation, setShowConfirmation] = useState(false);
  const { darkMode } = useDarkMode();

  // Generate random barcode
  const generateBarcode = () => {
    const barcode = Date.now(); // Returns timestamp as barcode number
    console.log("🔢 Generated barcode:", barcode);
    return barcode;
  };

  const handleInputChange = async (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    console.log("📝 Form field changed:", e.target.name, "=", e.target.value);
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear validation error for this field when user starts typing
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }

    // If description is being changed, validate it immediately
    if (name === "description" && value.trim()) {
      try {
        const response = await fetch(
          `http://localhost:4000/api/products/check-description?description=${encodeURIComponent(
            value.trim()
          )}`
        );
        if (!response.ok) {
          throw new Error("Failed to check description uniqueness");
        }
        const data = await response.json();
        if (data.exists) {
          setValidationErrors((prev) => ({
            ...prev,
            description: "A product with this description already exists",
          }));
        } else {
          setValidationErrors((prev) => {
            const newErrors = { ...prev };
            delete newErrors.description;
            return newErrors;
          });
        }
      } catch (err) {
        console.error("Error checking description uniqueness:", err);
      }
    }
  };

  const validateForm = async () => {
    const errors: { [key: string]: string } = {};

    // Brand validation
    if (!formData.brand.trim()) {
      errors.brand = "Brand name is required";
    } else if (formData.brand.trim().length < 2) {
      errors.brand = "Brand name must be at least 2 characters long";
    } else if (formData.brand.trim().length > 50) {
      errors.brand = "Brand name must be less than 50 characters";
    }

    // Check for unique description if one is provided
    if (formData.description.trim()) {
      try {
        const response = await fetch(
          `http://localhost:4000/api/products/check-description?description=${encodeURIComponent(
            formData.description.trim()
          )}`
        );
        if (!response.ok) {
          throw new Error("Failed to check description uniqueness");
        }
        const data = await response.json();
        if (data.exists) {
          errors.description = "A product with this description already exists";
        }
      } catch (err) {
        console.error("Error checking description uniqueness:", err);
        errors.description = "Failed to verify description uniqueness";
      }
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
    console.log("🚀 Starting form submission...");
    console.log("📋 Current form data:", formData);

    try {
      // Validate form before submission
      const errors = await validateForm();
      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        console.log("❌ Validation errors:", errors);
        return;
      }

      // Show confirmation dialog instead of submitting immediately
      setShowConfirmation(true);
    } catch (err) {
      console.error("Error during form validation:", err);
      setError("An error occurred while validating the form");
    }
  };

  const handleConfirmSubmit = async () => {
    console.log("✅ User confirmed submission, proceeding...");
    setShowConfirmation(false);
    setLoading(true);
    setError("");
    setValidationErrors({});

    // Prepare the request payload
    const payload = {
      brand: formData.brand,
      boxColor: formData.boxColor || "",
      boxNumber: formData.boxNumber || "",
      barcode: parseInt(formData.barcode || generateBarcode().toString()),
      description: formData.description,
      category: formData.category,
      stocks: parseInt(formData.stocks),
    };

    try {
      const response = await fetch("http://localhost:4000/api/products/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      console.log("📥 Response received:", {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries()),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Response not OK:", {
          status: response.status,
          statusText: response.statusText,
          errorText: errorText,
        });
        throw new Error(
          `HTTP ${response.status}: ${response.statusText} - ${errorText}`
        );
      }

      const result = await response.json();
      console.log("✅ Product added successfully:", result);
      console.log("🎉 API call completed successfully");

      // Reset form
      setFormData({
        brand: "",
        boxColor: "",
        boxNumber: "",
        barcode: "",
        description: "",
        category: "",
        stocks: "",
      });

      console.log("🔄 Form reset, calling onProductAdded with new product...");
      onProductAdded(result);
      onClose();
    } catch (err) {
      console.error("💥 Error details:", {
        name: (err as Error).name,
        message: (err as Error).message,
        stack: (err as Error).stack,
        type: typeof err,
      });

      if (
        err instanceof TypeError &&
        (err as Error).message.includes("Failed to fetch")
      ) {
        console.error("🔌 Network Error - Possible causes:");
        console.error("   - Server not running on localhost:4000");
        console.error("   - CORS issues");
        console.error("   - Network connectivity problems");
        console.error("   - Firewall blocking the request");
      }

      setError("Failed to add product. Please try again.");
      console.error("❌ Error adding product:", err);
    } finally {
      console.log("🏁 Form submission completed, setting loading to false");
      setLoading(false);
    }
  };

  const handleClose = () => {
    console.log("🚪 Closing modal, resetting form...");
    setFormData({
      brand: "",
      boxColor: "",
      boxNumber: "",
      barcode: "",
      description: "",
      category: "",
      stocks: "",
    });
    setError("");
    setValidationErrors({});
    setShowConfirmation(false);
    onClose();
  };

  // Auto-generate barcode when modal opens
  const handleModalOpen = () => {
    console.log("🚪 Modal opened, checking barcode...");
    if (!formData.barcode) {
      const newBarcode = generateBarcode().toString();
      console.log("🔢 Auto-generating barcode:", newBarcode);
      setFormData((prev) => ({
        ...prev,
        barcode: newBarcode,
      }));
    } else {
      console.log("🔢 Barcode already exists:", formData.barcode);
    }
  };

  // Check if form is valid for enabling submit button
  const isFormValid = () => {
    const hasRequiredFields =
      formData.brand.trim() &&
      formData.barcode &&
      formData.category &&
      formData.stocks;

    const hasNoErrors = Object.keys(validationErrors).length === 0;

    // If description is provided, make sure it's not a duplicate
    const isDescriptionValid =
      !formData.description.trim() || !validationErrors.description;

    return hasRequiredFields && hasNoErrors && isDescriptionValid;
  };

  if (!isOpen) return null;

  console.log("🎨 Rendering AddProductModal with state:", {
    loading,
    error,
    formData,
    isOpen,
  });

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      {showConfirmation ? (
        // Confirmation Dialog
        <div
          className={`p-6 border w-96 shadow-lg rounded-md ${
            darkMode ? "bg-gray-800" : "bg-white"
          }`}
        >
          <div className="text-center">
            <h3
              className={`text-lg font-medium mb-4 ${
                darkMode ? "text-white" : "text-gray-900"
              }`}
            >
              Confirm Product Details
            </h3>

            <div className="text-left space-y-3 mb-6">
              <div>
                <span
                  className={`font-medium ${
                    darkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Category:
                </span>
                <span
                  className={`ml-2 capitalize ${
                    darkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  {formData.category}
                </span>
              </div>

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
                    darkMode ? "text-white" : "text-gray-900"
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
                  Description:
                </span>
                <span
                  className={`ml-2 ${
                    darkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  {formData.description}
                </span>
              </div>

              <div>
                <span
                  className={`font-medium ${
                    darkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Stocks:
                </span>
                <span
                  className={`ml-2 ${
                    darkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  {formData.stocks}
                </span>
              </div>

              <div>
                <span
                  className={`font-medium ${
                    darkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Box color:
                </span>
                <span
                  className={`ml-2 ${
                    darkMode ? "text-white" : "text-gray-900"
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
                  Box number:{" "}
                </span>
                <span
                  className={`ml-2 ${
                    darkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  {formData.boxNumber}
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
                    darkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  {formData.barcode}
                </span>
              </div>

              
            </div>

            <div className="flex justify-center space-x-3">
              <button
                type="button"
                onClick={() => setShowConfirmation(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Back to Edit
              </button>
              <button
                type="button"
                onClick={handleConfirmSubmit}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Confirm & Add
              </button>
            </div>
          </div>
        </div>
      ) : (
        // Main Form
        <div
          className={`p-5 border w-96 shadow-lg rounded-md ${
            darkMode ? "bg-gray-800" : "bg-white"
          }`}
        >
          <div className="mt-3">
            <div className="flex justify-between items-center mb-4">
              <h3
                className={`text-lg font-medium ${
                  darkMode ? "text-white" : "text-gray-900"
                }`}
              >
                Add New Product
              </h3>
              <button
                onClick={handleClose}
                className={`${
                  darkMode
                    ? "text-gray-300 hover:text-gray-100"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}

            {/* Add Product form */}
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
                <select
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
                      ? "bg-gray-700 text-white"
                      : "bg-white text-gray-900"
                  }`}
                >
                  <option value="">Select category</option>
                  <option value="bearing">Bearing</option>
                </select>
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
                      : "bg-white text-gray-900 placeholder-gray-500"
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
                  maxLength={100}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    validationErrors.description
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                  placeholder="Enter product description"
                  required
                />
                <div className="flex justify-between items-center mt-1">
                  {validationErrors.description && (
                    <p className="text-red-500 text-xs">
                      {validationErrors.description}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 ml-auto">
                    {formData.description.length}/100 characters
                  </p>
                </div>
              </div>

              {/* Stocks */}
              <div>
                <label
                  className={`block text-sm font-medium mb-1 ${
                    darkMode ? "text-white" : "text-gray-700"
                  }`}
                >
                  Stocks *
                </label>
                <input
                  type="number"
                  name="stocks"
                  value={formData.stocks}
                  onChange={handleInputChange}
                  required
                  min="0"
                  max="999999"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    validationErrors.stocks
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                  placeholder="Enter stock quantity"
                />
                {validationErrors.stocks && (
                  <p className="text-red-500 text-xs mt-1">
                    {validationErrors.stocks}
                  </p>
                )}
              </div>

              {/* Box color */}
              <div>
                <label
                  className={`block text-sm font-medium mb-1 ${
                    darkMode ? "text-white" : "text-gray-700"
                  }`}
                >
                  Box Color
                </label>
                <select
                  name="boxColor"
                  value={formData.boxColor}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    darkMode
                      ? "border-gray-600 bg-gray-700 text-white"
                      : "border-gray-300 bg-white text-gray-900"
                  }`}
                >
                  <option value="">Select box color</option>
                  <option value="Black">Black</option>
                  <option value="White">White</option>
                </select>
              </div>

              {/* Box number */}
              <div>
                <label
                  className={`block text-sm font-medium mb-1 ${
                    darkMode ? "text-white" : "text-gray-700"
                  }`}
                >
                  Box Number
                </label>
                <input
                  type="text"
                  name="boxNumber"
                  value={formData.boxNumber}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    darkMode
                      ? "border-gray-600 bg-gray-700 text-white placeholder-gray-400"
                      : "border-gray-300 bg-white text-gray-900 placeholder-gray-500"
                  }`}
                  placeholder="Enter box number"
                />
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
                <div className="flex gap-2">
                  <input
                    type="number"
                    name="barcode"
                    value={formData.barcode}
                    onChange={handleInputChange}
                    required
                    className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      validationErrors.barcode
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                    placeholder="Auto-generated"
                    readOnly
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const newBarcode = generateBarcode().toString();
                      console.log("🔄 Regenerating barcode:", newBarcode);
                      setFormData((prev) => ({ ...prev, barcode: newBarcode }));
                      // Clear barcode validation error when regenerating
                      if (validationErrors.barcode) {
                        setValidationErrors((prev) => ({
                          ...prev,
                          barcode: "",
                        }));
                      }
                    }}
                    className="px-3 py-2 text-sm font-medium text-blue-600 bg-blue-100 border border-blue-300 rounded-lg hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Generate
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Barcode is auto-generated from timestamp
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
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !isFormValid()}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Adding..." : "Add Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
