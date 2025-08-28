"use client";

import axios from 'axios';
import { useState, useEffect } from 'react';
import { FiTrash2 } from 'react-icons/fi';

interface Product {
    _id: string;
    brand: string;
    barcode: number;
    description: string;
    category: string;
    stocks: number;
    isDeleted: boolean;
    createdAt: string;
    updatedAt: string;
}

export default function ProductTable() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [sortField, setSortField] = useState<keyof Product>('brand');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const handleDeleteProduct = async (id: string) => {
        try {
            const response = await axios.delete(`http://localhost:4000/api/products/delete/${id}`);
            if (response.status === 200) {
                fetchProducts();
            } else {
                throw new Error('Failed to delete product');
            }
        } catch (error) {
            setError('Failed to delete product');
        }
    }

    const handleDeleteAll = async () => {
        try {
            const response = await axios.delete('http://localhost:4000/api/products/delete-all');
            if (response.status === 200) {
                setShowDeleteConfirm(false);
                fetchProducts();
            } else {
                throw new Error('Failed to delete all products');
            }
        } catch (error) {
            setError('Failed to delete all products');
            setShowDeleteConfirm(false);
        }
    }

    // Fetch products
    const fetchProducts = async () => {
        try {
            setLoading(true);
            const response = await fetch('http://localhost:4000/api/products/get');
            if (!response.ok) throw new Error('Failed to fetch products');
            const data = await response.json();
            setProducts(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchProducts();
    }, []);

    // Sort products
    const sortProducts = (field: keyof Product) => {
        setSortField(field);
        setSortDirection(current => current === 'asc' ? 'desc' : 'asc');
    };

    const sortedProducts = [...products].sort((a, b) => {
        if (sortDirection === 'asc') {
            return a[sortField] > b[sortField] ? 1 : -1;
        }
        return a[sortField] < b[sortField] ? 1 : -1;
    });

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div className="container mx-auto p-4">
            <div className="mb-4 flex justify-end">
                <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
                    disabled={products.length === 0}
                >
                    Delete All Products
                </button>
            </div>

            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Delete All</h3>
                        <p className="text-sm text-gray-500 mb-4">
                            Are you sure you want to delete all products? This action cannot be undone.
                        </p>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteAll}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                            >
                                Delete All
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="min-w-full bg-white rounded-lg overflow-hidden shadow-lg text-center">
                    <thead className="bg-gray-100">
                        <tr>
                            <th onClick={() => sortProducts('barcode')}
                                className="px-6 py-3 cursor-pointer hover:bg-gray-200 text-center">
                                Barcode {sortField === 'barcode' && (sortDirection === 'asc' ? '↑' : '↓')}
                            </th>
                            <th onClick={() => sortProducts('brand')}
                                className="px-6 py-3 cursor-pointer hover:bg-gray-200 text-center">
                                Brand {sortField === 'brand' && (sortDirection === 'asc' ? '↑' : '↓')}
                            </th>

                            <th onClick={() => sortProducts('description')}
                                className="px-6 py-3 cursor-pointer hover:bg-gray-200 text-center">
                                Description {sortField === 'description' && (sortDirection === 'asc' ? '↑' : '↓')}
                            </th>
                            <th onClick={() => sortProducts('category')}
                                className="px-6 py-3 cursor-pointer hover:bg-gray-200 text-center">
                                Category {sortField === 'category' && (sortDirection === 'asc' ? '↑' : '↓')}
                            </th>
                            <th onClick={() => sortProducts('stocks')}
                                className="px-6 py-3 cursor-pointer hover:bg-gray-200 text-center">
                                Stocks {sortField === 'stocks' && (sortDirection === 'asc' ? '↑' : '↓')}
                            </th>
                            <th className="px-6 py-3 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {sortedProducts.map((product) => (
                            <tr key={product._id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 font-mono text-center">{product.barcode}</td>
                                <td className="px-6 py-4 text-center">{product.brand}</td>
                                <td className="px-6 py-4 text-center">{product.description}</td>
                                <td className="px-6 py-4 text-center">{product.category}</td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`px-2 py-1 rounded-full text-sm ${product.stocks === 0 ? 'bg-red-100 text-red-800' :
                                        product.stocks <= 10 ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-green-100 text-green-800'
                                        }`}>
                                        {product.stocks}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <div className="flex justify-center space-x-2">
                                        <button
                                            className="text-red-600 hover:text-red-800"
                                            onClick={() => handleDeleteProduct(product._id)}
                                        >
                                            <FiTrash2 />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}