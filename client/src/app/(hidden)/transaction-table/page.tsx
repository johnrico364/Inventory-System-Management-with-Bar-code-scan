"use client";

import axios from "axios";
import { useState, useEffect } from "react";

interface Product {
  _id: string;
  brand: string;
  description: string;
  barcode: number;
  category: string;
  stocks: number;
}

interface Transaction {
  _id: string;
  product: Product;
  quantity: number;
  action: string;
  createdAt: string;
  updatedAt: string;
}

export default function TransactionTable() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAction, setSelectedAction] = useState<string>("all");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Get unique actions for filter dropdown
  const uniqueActions = Array.from(
    new Set(transactions.map((t) => t.action))
  ).sort();

  useEffect(() => {
    fetchTransactions();
  }, []);

  useEffect(() => {
    filterTransactions();
  }, [transactions, searchTerm, selectedAction]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("http://localhost:4000/api/transactions/get", {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Server responded with status ${response.status}`);
      }
      
      const data = await response.json();
      setTransactions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch transactions");
    } finally {
      setLoading(false);
    }
  };

  const filterTransactions = () => {
    let filtered = transactions;

    if (searchTerm) {
      filtered = filtered.filter((transaction) =>
        (transaction.product?.brand || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (transaction.product?.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (transaction.product?.barcode?.toString() || '').includes(searchTerm) ||
        (transaction.action || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedAction !== "all") {
      filtered = filtered.filter((transaction) => transaction.action === selectedAction);
    }

    setFilteredTransactions(filtered);
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case "Product Added":
        return "bg-green-100 text-green-800 border-green-200";
      case "Stock In":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Product Update":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Product Archived":
        return "bg-red-100 text-red-800 border-red-200";
      case "Product Restored":
        return "bg-purple-100 text-purple-800 border-purple-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const handleDelete = async (transactionId: string) => {
    if (!confirm('Are you sure you want to delete this transaction?')) {
      return;
    }

    try {
        const response = await axios.delete(`http://localhost:4000/api/transactions/delete/${transactionId}`);
        console.log(response.data);
        if (response.status === 200) {
            await fetchTransactions();
        }
    } catch (error) {
        return setError('Failed to delete transaction');
    }
  };

  const handleDeleteAll = async () => {
    try {
      const response = await axios.delete('http://localhost:4000/api/transactions/delete-all');
      if (response.status === 200) {
        setShowDeleteConfirm(false);
        await fetchTransactions();
      } else {
        throw new Error('Failed to delete all transactions');
      }
    } catch (error) {
      setError('Failed to delete all transactions');
      setShowDeleteConfirm(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Delete All Confirmation Dialog */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Delete All</h3>
              <p className="text-sm text-gray-500 mb-4">
                Are you sure you want to delete all transactions? This action cannot be undone.
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

        {/* Delete All Button */}
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
            disabled={transactions.length === 0}
          >
            Delete All Transactions
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <input
                type="text"
                placeholder="Search by product, barcode, or action..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Action Type
              </label>
              <select
                value={selectedAction}
                onChange={(e) => setSelectedAction(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Actions</option>
                {uniqueActions.map((action) => (
                  <option key={action} value={action}>{action}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No transactions found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Barcode
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTransactions.map((transaction) => (
                    <tr key={transaction._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {transaction.product?.brand || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {transaction.product?.description || 'N/A'}
                          </div>
                          <div className="text-xs text-gray-400">
                            {transaction.product?.category || 'N/A'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getActionColor(transaction.action)}`}>
                          {transaction.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {transaction.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(transaction.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {transaction.product?.barcode || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button
                          onClick={() => handleDelete(transaction._id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}