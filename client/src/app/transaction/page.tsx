"use client";

import { useState, useEffect } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useDarkMode } from '../context/DarkModeContext';

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

export default function Transaction() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAction, setSelectedAction] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date" | "action" | "quantity">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const { darkMode, toggleDarkMode } = useDarkMode();

  // Get unique actions for filter dropdown
  const uniqueActions = Array.from(
    new Set(transactions.map((t) => t.action))
  ).sort();

  useEffect(() => {
    fetchTransactions();
  }, []);

  useEffect(() => {
    filterAndSortTransactions();
  }, [transactions, searchTerm, selectedAction, sortBy, sortOrder]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError(null); // Clear any previous errors
      const response = await fetch("http://localhost:4000/api/transactions/get", {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `Server responded with status ${response.status}`);
      }
      
      const data = await response.json();
      if (!Array.isArray(data)) {
        throw new Error('Invalid data format received from server');
      }
      
      setTransactions(data);
    } catch (err) {
      console.error('Transaction fetch error:', err);
      setError(err instanceof Error ? err.message : "Failed to connect to the server. Please check your network connection.");
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortTransactions = () => {
    let filtered = transactions;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter((transaction) =>
        (transaction.product?.brand || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (transaction.product?.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (transaction.product?.barcode?.toString() || '').includes(searchTerm) ||
        (transaction.action || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by action
    if (selectedAction !== "all") {
      filtered = filtered.filter((transaction) => transaction.action === selectedAction);
    }

    // Sort transactions
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case "date":
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case "action":
          comparison = a.action.localeCompare(b.action);
          break;
        case "quantity":
          comparison = a.quantity - b.quantity;
          break;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

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

  const downloadPDF = () => {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(20);
    doc.text("Transaction History Report", 14, 22);
    
    // Add subtitle with date
    doc.setFontSize(12);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 32);
    
    // Add summary
    doc.setFontSize(10);
    doc.text(`Total Transactions: ${transactions.length}`, 14, 42);

    // Calculate Stock In and Stock Out totals
    const totalStockIn = transactions
      .filter(t => t.action === 'Stock In')
      .reduce((sum, t) => sum + (typeof t.quantity === 'number' ? t.quantity : 0), 0);
    const totalStockOut = transactions
      .filter(t => t.action === 'Stock Out')
      .reduce((sum, t) => sum + (typeof t.quantity === 'number' ? t.quantity : 0), 0);

    doc.text(`Total Stock In Items: ${totalStockIn}`, 14, 48);
    doc.text(`Total Stock Out Items: ${totalStockOut}`, 14, 54);

    
    // Prepare table data
    const tableData = filteredTransactions.map((transaction) => [
      transaction.product?.brand || 'N/A',
      transaction.product?.description || 'N/A',
      transaction.action || 'N/A',
      transaction.quantity?.toString() || '0',
      formatDate(transaction.createdAt),
      transaction.product?.barcode?.toString() || 'N/A'
    ]);
    
    // Add table
    autoTable(doc, {
      head: [['Product', 'Description', 'Action', 'Quantity', 'Date & Time', 'Barcode']],
      body: tableData,
      startY: 70,
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [59, 130, 246], // Blue color
        textColor: 255,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252], // Light gray
      },
      columnStyles: {
        0: { cellWidth: 30 }, // Product
        1: { cellWidth: 40 }, // Description
        2: { cellWidth: 25 }, // Action
        3: { cellWidth: 15 }, // Quantity
        4: { cellWidth: 35 }, // Date
        5: { cellWidth: 25 }, // Barcode
      },
      margin: { top: 70 },
    });
    
    // Add footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(`Page ${i} of ${pageCount}`, 14, doc.internal.pageSize.height - 10);
    }
    
    // Download the PDF
    doc.save(`transaction-history-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        darkMode ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className={`mt-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Loading transactions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Transactions</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchTransactions}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={darkMode ? "min-h-screen bg-gray-900 text-white transition-colors" : "min-h-screen bg-white transition-colors"}>
      {/* Page Header */}
      <div className={darkMode ? "bg-gradient-to-r from-blue-950 via-blue-900 to-blue-800 shadow-lg border-b border-blue-950" : "bg-gradient-to-r from-blue-900 via-blue-800 to-blue-700 shadow-lg border-b border-blue-900"}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className={darkMode ? "w-2 h-8 bg-blue-600 rounded-r-lg" : "w-2 h-8 bg-blue-400 rounded-r-lg"}></div>
                <h1 className="text-4xl font-extrabold text-white tracking-tight drop-shadow-lg">Transaction History</h1>
              </div>
              <p className={darkMode ? "text-blue-200 mt-1 text-lg font-medium tracking-wide" : "text-blue-100 mt-1 text-lg font-medium tracking-wide"}>Track all product actions and stock changes in your inventory system</p>
            </div>

          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={darkMode ? "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-white" : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"}>
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-blue-800 rounded-2xl shadow-xl border border-blue-800 p-6">
            <div className="flex items-center">
              <div className="text-2xl mr-3">📋</div>
              <div>
                <p className="text-xs font-semibold tracking-widest text-blue-200 uppercase mb-1">Total Transactions</p>
                <p className="text-3xl font-extrabold text-white mt-1 drop-shadow-lg">{transactions.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-blue-800 rounded-2xl shadow-xl border border-blue-800 p-6">
            <div className="flex items-center">
              <div className="text-2xl mr-3">📦</div>
              <div>
                <p className="text-xs font-semibold tracking-widest text-blue-200 uppercase mb-1">Total Stock Out</p>
                <p className="text-3xl font-extrabold text-white mt-1 drop-shadow-lg">{transactions.filter(t => t.action === 'Stock Out').reduce((sum, t) => sum + (typeof t.quantity === 'number' ? t.quantity : 0), 0)}</p>
              </div>
            </div>
          </div>
          <div className="bg-blue-800 rounded-2xl shadow-xl border border-blue-800 p-6">
            <div className="flex items-center">
              <div className="text-2xl mr-3">📈</div>
              <div>
                <p className="text-xs font-semibold tracking-widest text-blue-200 uppercase mb-1">Total Stock In</p>
                <p className="text-3xl font-extrabold text-white mt-1 drop-shadow-lg">{transactions.filter(t => t.action === 'Stock In').reduce((sum, t) => sum + (typeof t.quantity === 'number' ? t.quantity : 0), 0)}</p>
              </div>
            </div>
          </div>
          <div className="bg-blue-800 rounded-2xl shadow-xl border border-blue-800 p-6">
            <div className="flex items-center">
              <div className="text-2xl mr-3">📊</div>
              <div>
                <p className="text-xs font-semibold tracking-widest text-blue-200 uppercase mb-1">Product Update</p>
                <p className="text-3xl font-extrabold text-white mt-1 drop-shadow-lg">{uniqueActions.length}</p>
              </div>
            </div>
            </div>
        </div>

        {/* Filters and Search */}
        <div className={`${darkMode ? "bg-gray-800" : "bg-white"} border border-blue-100 mb-6 p-6`}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className={
                `block text-sm font-medium mb-2 ${darkMode ? 'text-white' : 'black'}`
              }>
                Search
              </label>
              <input
                type="text"
                placeholder="Search by product, barcode, or action..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full px-3 py-2 border border-blue-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${darkMode ? 'bg-gray-900 text-blue-100 placeholder-blue-300' : 'bg-white text-blue-900 placeholder-blue-400'}`}
              />
            </div>

            {/* Action Filter */}
            <div>
              <label className={
                `block text-sm font-medium mb-2 ${darkMode ? 'text-white' : 'black'}`
              }>
                Action Type
              </label>
              <select
                value={selectedAction}
                onChange={(e) => setSelectedAction(e.target.value)}
                className={`w-full px-3 py-2 border border-blue-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${darkMode ? 'bg-gray-900 text-blue-100' : 'bg-white text-blue-900'}`}
              >
                <option value="all">All Actions</option>
                {uniqueActions.map((action) => (
                  <option key={action} value={action}>
                    {action}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort By */}
            <div>
              <label className={
                `block text-sm font-medium mb-2 ${darkMode ? 'text-white' : 'black'}`
              }>
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "date" | "action" | "quantity")}
                className={`w-full px-3 py-2 border border-blue-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${darkMode ? 'bg-gray-900 text-blue-100' : 'bg-white text-blue-900'}`}
              >
                <option value="date">Date</option>
                <option value="action">Action</option>
                <option value="quantity">Quantity</option>
              </select>
            </div>

            {/* Sort Order */}
            <div>
              <label className={
                `block text-sm font-medium mb-2 ${darkMode ? 'text-white' : 'black'}`
              }>
                Order
              </label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
                className={`w-full px-3 py-2 border border-blue-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${darkMode ? 'bg-gray-900 text-blue-100' : 'bg-white text-blue-900'}`}
              >
                <option value="desc">Newest First</option>
                <option value="asc">Oldest First</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-4">
          <p className="text-sm text-blue-700">
            Showing {filteredTransactions.length} of {transactions.length} transactions
          </p>
        </div>

        {/* Transactions Table */}
        <div className={darkMode ? "bg-gray-800 rounded-lg shadow-lg border border-gray-700 overflow-hidden" : "bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"}>
          {filteredTransactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <span className="text-4xl mb-2">📋</span>
              <p className={darkMode ? "text-gray-300 text-base font-semibold" : "text-blue-700 text-base font-semibold"}>No transactions found</p>
              <p className={darkMode ? "text-gray-400 text-xs" : "text-blue-600 text-xs"}>
                {transactions.length === 0 
                  ? "No transactions have been recorded yet." 
                  : "Try adjusting your search or filter criteria."
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className={darkMode ? "min-w-full divide-y divide-gray-700" : "min-w-full divide-y divide-gray-200"}>
                <thead className={darkMode ? "bg-gray-800" : "bg-gray-50"}>
                  <tr>
                    <th className={darkMode ? "px-6 py-3 text-left text-xs font-semibold text-gray-300 uppercase" : "px-6 py-3 text-left text-xs font-semibold text-blue-800 uppercase"}>
                      Product
                    </th>
                    <th className={darkMode ? "px-6 py-3 text-left text-xs font-semibold text-gray-300 uppercase" : "px-6 py-3 text-left text-xs font-semibold text-blue-800 uppercase"}>
                      Action
                    </th>
                    <th className={darkMode ? "px-6 py-3 text-left text-xs font-semibold text-gray-300 uppercase" : "px-6 py-3 text-left text-xs font-semibold text-blue-800 uppercase"}>
                      Quantity
                    </th>
                    <th className={darkMode ? "px-6 py-3 text-left text-xs font-semibold text-gray-300 uppercase" : "px-6 py-3 text-left text-xs font-semibold text-blue-800 uppercase"}>
                      Current Stock
                    </th>
                    <th className={darkMode ? "px-6 py-3 text-left text-xs font-semibold text-gray-300 uppercase" : "px-6 py-3 text-left text-xs font-semibold text-blue-800 uppercase"}>
                      Date & Time
                    </th>
                    <th className={darkMode ? "px-6 py-3 text-left text-xs font-semibold text-gray-300 uppercase" : "px-6 py-3 text-left text-xs font-semibold text-blue-800 uppercase"}>
                      Barcode
                    </th>
                  </tr>
                </thead>
                <tbody className={darkMode ? "bg-gray-900 divide-y divide-gray-700" : "bg-white divide-y divide-gray-200"}>
                  {filteredTransactions.map((transaction) => (
                    <tr key={transaction._id} className={darkMode ? "hover:bg-gray-800" : "hover:bg-gray-50"}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className={darkMode ? "text-sm font-semibold text-blue-400" : "text-sm font-semibold text-blue-900"}>
                            {transaction.product?.brand || 'N/A'}
                          </div>
                          <div className={darkMode ? "text-sm text-blue-500" : "text-sm text-blue-700"}>
                            {transaction.product?.description || 'No description'}
                          </div>
                          <div className={darkMode ? "text-sm text-blue-500" : "text-sm text-blue-600"}>
                            {transaction.product?.category || 'N/A'}
                        </div>
                      </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getActionColor(transaction.action)}`}>
                          {transaction.action}
                        </span>
                      </td>
                      <td className={darkMode ? "px-6 py-4 whitespace-nowrap text-sm text-gray-300" : "px-6 py-4 whitespace-nowrap text-sm text-blue-900"}>
                        {transaction.quantity}
                      </td>
                      <td className={darkMode ? "px-6 py-4 whitespace-nowrap text-sm text-gray-300" : "px-6 py-4 whitespace-nowrap text-sm text-blue-900"}>
                        {typeof transaction.product?.stocks === 'number' ? transaction.product.stocks : 'N/A'}
                      </td>
                      <td className={darkMode ? "px-6 py-4 whitespace-nowrap text-sm text-gray-300" : "px-6 py-4 whitespace-nowrap text-sm text-blue-700"}>
                        {formatDate(transaction.createdAt)}
                      </td>
                      <td className={darkMode ? "px-6 py-4 whitespace-nowrap text-sm text-gray-300" : "px-6 py-4 whitespace-nowrap text-sm text-blue-700"}>
                        {transaction.product?.barcode || 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <button 
            aria-label="Download PDF"
            onClick={downloadPDF}
            disabled={transactions.length === 0}
            className="bg-blue-800 border border-blue-900 rounded-lg p-4 hover:shadow-lg transition-shadow text-left text-white hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="text-2xl mb-2" aria-hidden="true">⬇️</div>
            <h3 className="font-medium text-white">Download PDF</h3>
            <p className="text-sm text-blue-100">Export transaction history</p>
          </button>
          <button 
            aria-label="Refresh Transactions"
            onClick={fetchTransactions}
            className="bg-blue-800 border border-blue-900 rounded-lg p-4 hover:shadow-lg transition-shadow text-left text-white hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <div className="text-2xl mb-2" aria-hidden="true">🔄</div>
            <h3 className="font-medium text-white">Refresh Transactions</h3>
            <p className="text-sm text-blue-100">Reload latest data</p>
          </button>
        </div>
      </div>
    </div>

  );
}