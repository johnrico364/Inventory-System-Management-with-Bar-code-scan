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

    const handeDeleteProduct = async (id: string) => {
        try {
            const response = await axios.delete(`http://localhost:4000/api/products/delete/${id}`);
            if (response.status === 200) {
                fetchProducts();
            } else {
                throw new Error('Failed to delete product');
            }
        } catch (error) {

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
                                            onClick={() => handeDeleteProduct(product._id)}
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