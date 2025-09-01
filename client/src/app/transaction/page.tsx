"use client";

import { useState, useEffect } from "react";
import * as XLSX from 'xlsx';
import { useDarkMode } from '../context/DarkModeContext';

interface Product {
  _id: string;
  brand: string;
  description: string;
  barcode: number;
  category: string;
  stocks: number;
  boxColor?: string;
  boxNumber?: string;
}

interface Transaction {
  _id: string;
  product: Product;
  quantity: number;
  action: string;
  createdAt: string;
  updatedAt: string;
  previousStock?: number;
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

  // Get unique actions for filter dropdown, excluding "Product Update"
  const uniqueActions = Array.from(
    new Set(transactions.filter(t => t.action !== "Product Update").map((t) => t.action))
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
      
      console.log('Fetching transactions...');
      const response = await fetch("http://localhost:4000/api/transactions/get", {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
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
    // First filter out Product Update actions
    let filtered = transactions.filter(t => t.action !== "Product Update");

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
      case "Stock Out":
        return "bg-orange-100 text-orange-800 border-orange-200";
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

  const downloadExcel = () => {
    // Calculate summary data
    const totalStockIn = transactions
      .filter(t => t.action === 'Stock In')
      .reduce((sum, t) => sum + (typeof t.quantity === 'number' ? t.quantity : 0), 0);
    const totalStockOut = transactions
      .filter(t => t.action === 'Stock Out')
      .reduce((sum, t) => sum + (typeof t.quantity === 'number' ? t.quantity : 0), 0);

    // Prepare worksheet data with summary at the top
    const worksheetData = [
      ['Transaction History Report'],
      ['Generated on:', new Date().toLocaleString()],
      ['Total Transactions:', transactions.length],
      ['Total Stock In:', totalStockIn],
      ['Total Stock Out:', totalStockOut],
      [''], // Empty row for spacing
      // Headers for transaction data
      ['Product', 'Description', 'Category', 'Action', 'Quantity', 'Current Stock', 'Box Color', 'Box Number', 'Barcode', 'Date & Time'],
      // Transaction data
      ...filteredTransactions.map((transaction) => [
        transaction.product?.brand || 'N/A',
        transaction.product?.description || 'N/A',
        transaction.product?.category || 'N/A',
        transaction.action || 'N/A',
        transaction.quantity || 0,
        transaction.product?.stocks || 'N/A',
        transaction.product?.boxColor || 'N/A',
        transaction.product?.boxNumber || 'N/A',
        transaction.product?.barcode?.toString() || 'N/A',
        formatDate(transaction.createdAt)
      ])
    ];

    // Create workbook with single worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(worksheetData);

    // Set column widths
    ws['!cols'] = [
      { wch: 20 }, // Product
      { wch: 30 }, // Description
      { wch: 15 }, // Category
      { wch: 15 }, // Action
      { wch: 10 }, // Quantity
      { wch: 15 }, // Current Stock
      { wch: 15 }, // Box Color
      { wch: 15 }, // Box Number
      { wch: 15 }, // Barcode
      { wch: 20 }, // Date & Time
    ];

    // Style the headers (row 7, index 6)
    const headerStyle = {
      font: { bold: true },
      fill: { fgColor: { rgb: "3B82F6" }, type: 'pattern', patternType: 'solid' },
      alignment: { horizontal: 'center' }
    };

    // Style the summary section
    const summaryStyle = {
      font: { bold: true },
      fill: { fgColor: { rgb: "EFF6FF" }, type: 'pattern', patternType: 'solid' }
    };

    // Apply styles to the summary section (first 5 rows)
    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < 2; j++) {
        const cell = XLSX.utils.encode_cell({ r: i, c: j });
        if (!ws[cell]) continue;
        ws[cell].s = summaryStyle;
      }
    }

    // Apply styles to transaction headers
    const headerRow = 6; // 7th row (0-based)
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const address = XLSX.utils.encode_cell({ r: headerRow, c: C });
      if (!ws[address]) continue;
      ws[address].s = headerStyle;
    }

    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Transaction History');

    // Save the file
    XLSX.writeFile(wb, `transaction-history-${new Date().toISOString().split('T')[0]}.xlsx`);
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
      <div className={`max-w-[100rem] mx-auto px-4 sm:px-6 lg:px-8 py-8 ${
  darkMode ? "text-white" : ""
}`}>
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
        <div className={`${
  darkMode 
    ? "bg-gray-800 rounded-lg shadow-lg border border-gray-700 overflow-hidden" 
    : "bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
} max-w-[98vw] mx-auto`}>
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
                      Previous Stock
                    </th>
                    <th className={darkMode ? "px-6 py-3 text-left text-xs font-semibold text-gray-300 uppercase" : "px-6 py-3 text-left text-xs font-semibold text-blue-800 uppercase"}>
                      Box Color
                    </th>
                    <th className={darkMode ? "px-6 py-3 text-left text-xs font-semibold text-gray-300 uppercase" : "px-6 py-3 text-left text-xs font-semibold text-blue-800 uppercase"}>
                      Box Number
                    </th>
                    <th className={darkMode ? "px-6 py-3 text-left text-xs font-semibold text-gray-300 uppercase" : "px-6 py-3 text-left text-xs font-semibold text-blue-800 uppercase"}>
                      Barcode
                    </th>
                    <th className={darkMode ? "px-6 py-3 text-left text-xs font-semibold text-gray-300 uppercase" : "px-6 py-3 text-left text-xs font-semibold text-blue-800 uppercase"}>
                      Date & Time
                    </th>
                  </tr>
                </thead>
                <tbody className={darkMode ? "bg-gray-900 divide-y divide-gray-700" : "bg-white divide-y divide-gray-200"}>
                  {filteredTransactions.map((transaction) => (
                    <tr key={transaction._id} className={darkMode ? "hover:bg-gray-800" : "hover:bg-gray-50"}>
                      <td className={`px-6 py-4 whitespace-nowrap ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                        <div className="flex items-center">
                          <div>
                            <div className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                              {transaction.product?.brand || 'N/A'}
                            </div>
                            <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              {transaction.product?.description || 'No description'}
                            </div>
                            <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                              {transaction.product?.category || 'N/A'}
                            </div>
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
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                        {typeof transaction.product?.stocks === 'number' ? transaction.product.stocks : 'N/A'}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${
  darkMode ? 'text-gray-300' : 'text-gray-900'
}`}>
  {transaction.previousStock ?? 'N/A'}
</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                        <span className="inline-flex items-center">
                          {transaction.product?.boxColor ? (
                            <>
                              <div 
                                className="w-4 h-4 rounded-full mr-2" 
                                style={{ backgroundColor: transaction.product.boxColor }}
                              />
                              {transaction.product.boxColor}
                            </>
                          ) : 'N/A'}
                        </span>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                        {transaction.product?.boxNumber || 'N/A'}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'} font-mono`}>
                        {transaction.product?.barcode || 'N/A'}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                        {formatDate(transaction.createdAt)}
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
            aria-label="Download Excel"
            onClick={downloadExcel}
            disabled={transactions.length === 0}
            className="bg-blue-800 border border-blue-900 rounded-lg p-4 hover:shadow-lg transition-shadow text-left text-white hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="text-2xl mb-2" aria-hidden="true">📊</div>
            <h3 className="font-medium text-white">Download Excel</h3>
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