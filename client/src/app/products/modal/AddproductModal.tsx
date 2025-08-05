'use client';

import { useState } from 'react';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductAdded: (newProduct?: any) => void;
}

interface FormData {
  brand: string;
  barcode: string;
  description: string;
  category: string;
  stocks: string;
}

export default function AddProductModal({ isOpen, onClose, onProductAdded }: AddProductModalProps) {
  const [formData, setFormData] = useState<FormData>({
    brand: '',
    barcode: '',
    description: '',
    category: '',
    stocks: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Generate random barcode
  const generateBarcode = () => {
    const barcode = Date.now(); // Returns timestamp as barcode number
    console.log('🔢 Generated barcode:', barcode);
    return barcode;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    console.log('📝 Form field changed:', e.target.name, '=', e.target.value);
    const { name, value } = e.target;
    
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear validation error for this field when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const errors: {[key: string]: string} = {};
    
    // Brand validation
    if (!formData.brand.trim()) {
      errors.brand = 'Brand name is required';
    } else if (formData.brand.trim().length < 2) {
      errors.brand = 'Brand name must be at least 2 characters long';
    } else if (formData.brand.trim().length > 50) {
      errors.brand = 'Brand name must be less than 50 characters';
    }
    
    // Barcode validation
    if (!formData.barcode) {
      errors.barcode = 'Barcode is required';
    } else if (isNaN(Number(formData.barcode))) {
      errors.barcode = 'Barcode must be a valid number';
    } else if (Number(formData.barcode) <= 0) {
      errors.barcode = 'Barcode must be a positive number';
    }
    
    // Category validation
    if (!formData.category) {
      errors.category = 'Category is required';
    }
    
    // Stocks validation
    if (!formData.stocks) {
      errors.stocks = 'Stock quantity is required';
    } else if (isNaN(Number(formData.stocks))) {
      errors.stocks = 'Stock quantity must be a valid number';
    } else if (Number(formData.stocks) < 0) {
      errors.stocks = 'Stock quantity cannot be negative';
    } else if (Number(formData.stocks) > 999999) {
      errors.stocks = 'Stock quantity cannot exceed 999,999';
    }
    
    // Description validation (optional but if provided, validate length)
    if (formData.description && formData.description.trim().length > 500) {
      errors.description = 'Description must be less than 500 characters';
    }
    
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🚀 Starting form submission...');
    console.log('📋 Current form data:', formData);
    
    // Validate form before submission
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      console.log('❌ Validation errors:', errors);
      return;
    }
    
    // Show confirmation dialog instead of submitting immediately
    setShowConfirmation(true);
  };

  const handleConfirmSubmit = async () => {
    console.log('✅ User confirmed submission, proceeding...');
    setShowConfirmation(false);
    setLoading(true);
    setError('');
    setValidationErrors({});

    // Prepare the request payload
    const payload = {
      brand: formData.brand,
      barcode: parseInt(formData.barcode || generateBarcode().toString()),
      description: formData.description,
      category: formData.category,
      stocks: parseInt(formData.stocks)
    };

    console.log('📦 Request payload:', payload);
    console.log('🌐 API endpoint: http://localhost:4000/api/products/add');

    try {
      console.log('📡 Making API request...');
      console.log('📤 Request details:', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const response = await fetch('http://localhost:4000/api/products/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log('📥 Response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Response not OK:', {
          status: response.status,
          statusText: response.statusText,
          errorText: errorText
        });
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Product added successfully:', result);
      console.log('🎉 API call completed successfully');
      
      // Reset form
      setFormData({
        brand: '',
        barcode: '',
        description: '',
        category: '',
        stocks: ''
      });
      
      console.log('🔄 Form reset, calling onProductAdded with new product...');
      onProductAdded(result);
      onClose();
    } catch (err) {
      console.error('💥 Error details:', {
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
      
      setError('Failed to add product. Please try again.');
      console.error('❌ Error adding product:', err);
    } finally {
      console.log('🏁 Form submission completed, setting loading to false');
      setLoading(false);
    }
  };

  const handleClose = () => {
    console.log('🚪 Closing modal, resetting form...');
    setFormData({
      brand: '',
      barcode: '',
      description: '',
      category: '',
      stocks: ''
    });
    setError('');
    setValidationErrors({});
    setShowConfirmation(false);
    onClose();
  };

  // Auto-generate barcode when modal opens
  const handleModalOpen = () => {
    console.log('🚪 Modal opened, checking barcode...');
    if (!formData.barcode) {
      const newBarcode = generateBarcode().toString();
      console.log('🔢 Auto-generating barcode:', newBarcode);
      setFormData(prev => ({
        ...prev,
        barcode: newBarcode
      }));
    } else {
      console.log('🔢 Barcode already exists:', formData.barcode);
    }
  };

  // Check if form is valid for enabling submit button
  const isFormValid = () => {
    return formData.brand.trim() && 
           formData.barcode && 
           formData.category && 
           formData.stocks && 
           Object.keys(validationErrors).length === 0;
  };

  if (!isOpen) return null;

  console.log('🎨 Rendering AddProductModal with state:', {
    loading,
    error,
    formData,
    isOpen
  });

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      {showConfirmation ? (
        // Confirmation Dialog
        <div className="p-6 border w-96 shadow-lg rounded-md bg-white">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Product Details</h3>
            
            <div className="text-left space-y-3 mb-6">
              <div>
                <span className="font-medium text-gray-700">Brand:</span>
                <span className="ml-2 text-gray-900">{formData.brand}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Barcode:</span>
                <span className="ml-2 text-gray-900">{formData.barcode}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Category:</span>
                <span className="ml-2 text-gray-900 capitalize">{formData.category}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Stocks:</span>
                <span className="ml-2 text-gray-900">{formData.stocks}</span>
              </div>
              {formData.description && (
                <div>
                  <span className="font-medium text-gray-700">Description:</span>
                  <span className="ml-2 text-gray-900">{formData.description}</span>
                </div>
              )}
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
        <div className="p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Add New Product</h3>
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
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  validationErrors.brand ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter brand name"
              />
              {validationErrors.brand && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.brand}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
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
                    validationErrors.barcode ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Auto-generated"
                  readOnly
                />
                <button
                  type="button"
                  onClick={() => {
                    const newBarcode = generateBarcode().toString();
                    console.log('🔄 Regenerating barcode:', newBarcode);
                    setFormData(prev => ({ ...prev, barcode: newBarcode }));
                    // Clear barcode validation error when regenerating
                    if (validationErrors.barcode) {
                      setValidationErrors(prev => ({ ...prev, barcode: '' }));
                    }
                  }}
                  className="px-3 py-2 text-sm font-medium text-blue-600 bg-blue-100 border border-blue-300 rounded-lg hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Generate
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Barcode is auto-generated from timestamp</p>
              {validationErrors.barcode && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.barcode}</p>
              )}
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
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  validationErrors.category ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select category</option>
                <option value="bearing">Bearing</option>
                <option value="electronics">Electronics</option>
                <option value="clothing">Clothing</option>
                <option value="books">Books</option>
                <option value="home">Home & Garden</option>
                <option value="sports">Sports</option>
              </select>
              {validationErrors.category && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.category}</p>
              )}
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
                max="999999"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  validationErrors.stocks ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter stock quantity"
              />
              {validationErrors.stocks && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.stocks}</p>
              )}
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
                maxLength={500}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  validationErrors.description ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter product description"
              />
              <div className="flex justify-between items-center mt-1">
                {validationErrors.description && (
                  <p className="text-red-500 text-xs">{validationErrors.description}</p>
                )}
                <p className="text-xs text-gray-500 ml-auto">
                  {formData.description.length}/500 characters
                </p>
              </div>
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
                {loading ? 'Adding...' : 'Add Product'}
              </button>
                         </div>
           </form>
         </div>
       </div>
      )}
    </div>
  );
}
