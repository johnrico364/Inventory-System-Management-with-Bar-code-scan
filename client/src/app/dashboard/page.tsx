'use client';

import { useState, useEffect } from 'react';
import { useDarkMode } from '../context/DarkModeContext';

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

interface InventoryStats {
  totalProducts: number;
  lowStockItems: number;
  outOfStockItems: number;
  totalValue: number;
  categories: { [key: string]: number };
  recentProducts: Product[];
}

interface CategoryStats {
  name: string;
  count: number;
  percentage: number;
  totalStock: number;
}

interface StockStatus {
  inStock: number;
  lowStock: number;
  outOfStock: number;
}

interface Transaction {
  _id: string;
  product: Product;
  quantity: number;
  action: string;
  createdAt: string;
  updatedAt: string;
}

export default function Dashboard() {
  // Dark mode state with localStorage persistence
  const { darkMode, toggleDarkMode } = useDarkMode();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<InventoryStats>({
    totalProducts: 0,
    lowStockItems: 0,
    outOfStockItems: 0,
    totalValue: 0,
    categories: {},
    recentProducts: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch products from API
  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('📡 Fetching products for dashboard...');
      const response = await fetch('http://localhost:4000/api/products/get');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('✅ Products fetched successfully for dashboard:', data.length, 'products');
      setProducts(data);
    } catch (err) {
      console.error('❌ Error fetching products for dashboard:', err);
      setError('Failed to fetch dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Calculate dashboard statistics
  const calculateStats = (products: Product[]) => {
    const totalProducts = products.length;
    const lowStockItems = products.filter(p => p.stocks > 0 && p.stocks <= 10).length;
    const outOfStockItems = products.filter(p => p.stocks === 0).length;
    
    // Calculate categories
    const categories: { [key: string]: number } = {};
    products.forEach(product => {
      categories[product.category] = (categories[product.category] || 0) + 1;
    });

    // Get recent products (last 5 added)
    const recentProducts = [...products]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);

    // Estimate total value (assuming average value per product)
    const estimatedValuePerProduct = 100; // This could be enhanced with actual pricing data
    const totalValue = totalProducts * estimatedValuePerProduct;

    return {
      totalProducts,
      lowStockItems,
      outOfStockItems,
      totalValue,
      categories,
      recentProducts
    };
  };

  const fetchTransactions = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/transactions/get');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      setTransactions(data);
    } catch (err) {
      console.error('Error fetching transactions:', err);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchTransactions();
  }, []);

  useEffect(() => {
    if (products.length > 0) {
      const calculatedStats = calculateStats(products);
      setStats(calculatedStats);
    }
  }, [products]);

  const StatCard = ({ title, value, icon, trend, trendValue, color, subtitle }: {
    title: string;
    value: string | number;
    icon: string;
    trend?: 'up' | 'down' | 'neutral';
    trendValue?: string;
    color: string;
    subtitle?: string;
  }) => (
    <div className="bg-blue-800 rounded-2xl shadow-xl border border-blue-800 p-6 hover:shadow-2xl transition-transform duration-200 hover:scale-105 relative overflow-hidden">
      <div className="absolute left-0 top-0 h-full w-1 bg-blue-400 rounded-r-lg"></div>
      <div className="flex items-center justify-between relative z-10">
        <div>
          <p className="text-xs font-semibold tracking-widest text-blue-200 uppercase mb-1 flex items-center gap-2"><span className='w-2 h-2 bg-blue-400 rounded-full inline-block'></span>{title}</p>
          <p className="text-3xl font-extrabold text-white mt-1 drop-shadow-lg">{value}</p>
          {subtitle && (
            <p className="text-xs text-blue-100 mt-1 font-medium">{subtitle}</p>
          )}
          {trend && trendValue && (
            <div className="flex items-center mt-2">
              {trend === 'up' ? (
                <span className="text-green-300 animate-bounce">↗</span>
              ) : trend === 'down' ? (
                <span className="text-red-300 animate-bounce">↘</span>
              ) : (
                <span className="text-blue-200">→</span>
              )}
              <span className={`text-xs ml-1 ${
                trend === 'up' ? 'text-green-200' : 
                trend === 'down' ? 'text-red-200' : 'text-blue-200'
              } font-semibold`}>
                {trendValue}
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center justify-center w-14 h-14 rounded-full bg-blue-200/30 shadow-inner">
          <span className="text-3xl text-blue-100 drop-shadow-lg">{icon}</span>
        </div>
      </div>
    </div>
  );

  const CategoryChart = ({ categories }: { categories: { [key: string]: number } }) => {
    const total = Object.values(categories).reduce((sum, count) => sum + count, 0);
    const categoryData = Object.entries(categories)
      .map(([name, count]) => ({
        name,
        count,
        percentage: Math.round((count / total) * 100)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const colors = ['bg-blue-800', 'bg-blue-600', 'bg-blue-400', 'bg-blue-300', 'bg-blue-200'];

    return (
      <div className={`${darkMode ? "bg-gray-800 hover:bg-gray-800/80" : "bg-white hover:bg-gray-50"} rounded-2xl shadow-xl border-2 ${darkMode ? "border-blue-900" : "border-blue-200"} hover:border-blue-500 p-6 transition-all duration-300`}>
        <div className="flex items-center mb-4">
          <div className="w-1.5 h-6 bg-blue-800 rounded-r-lg mr-3"></div>
          <span className={`${darkMode ? "text-blue-400" : "text-blue-700"} text-xl mr-2`}>🏷️</span>
          <h3 className={`text-lg font-bold ${darkMode ? "text-white" : "text-blue-900"} tracking-wide`}>Top Categories</h3>
        </div>
        <div className="space-y-3">
          {categoryData.map((category, index) => (
            <div key={category.name} className="flex items-center justify-between group">
              <div className="flex items-center">
                <div className={`w-4 h-4 rounded-full ${colors[index % colors.length]} mr-3 border-2 border-blue-100 group-hover:scale-110 transition-transform`}></div>
                <span className={`font-semibold text-base ${darkMode ? "text-white hover:text-gray-200" : "text-blue-900 hover:text-blue-800"} transition-colors`}>{category.name}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`font-semibold ${darkMode ? "text-gray-300" : "text-blue-800"}`}>{category.count} items</span>
                <span className={`text-xs ${darkMode ? "text-gray-400" : "text-blue-400"} font-medium`}>({category.percentage}%)</span>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-blue-100">
          <div className="flex justify-between text-xs text-white font-semibold tracking-wide">
            <span>Total Categories: {Object.keys(categories).length}</span>
            <span>Total Products: {total}</span>
          </div>
        </div>
      </div>
    );
  };

  const StockStatusChart = ({ products }: { products: Product[] }) => {
    const inStock = products.filter(p => p.stocks > 10).length;
    const lowStock = products.filter(p => p.stocks > 0 && p.stocks <= 10).length;
    const outOfStock = products.filter(p => p.stocks === 0).length;
    const total = products.length;

    const getPercentage = (count: number) => Math.round((count / total) * 100);

    return (
      <div className={`${darkMode ? "bg-gray-800 hover:bg-gray-800/80" : "bg-white hover:bg-gray-50"} rounded-2xl shadow-xl border-2 ${darkMode ? "border-blue-900" : "border-blue-200"} hover:border-blue-500 p-6 transition-all duration-300`}>
        <div className="flex items-center mb-4">
          <div className="w-1.5 h-6 bg-blue-800 rounded-r-lg mr-3"></div>
          <span className={`${darkMode ? "text-blue-400" : "text-blue-700"} text-xl mr-2`}>📊</span>
          <h3 className={`text-lg font-bold ${darkMode ? "text-white" : "text-blue-900"} tracking-wide`}>Stock Status Overview</h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between group">
            <div className="flex items-center">
              <div className={`w-4 h-4 bg-green-500 rounded-full mr-3 border-2 ${darkMode ? "border-gray-600" : "border-blue-100"} group-hover:scale-110 transition-transform`}></div>
              <span className={`font-semibold ${darkMode ? "text-white hover:text-gray-200" : "text-blue-900 hover:text-blue-800"} transition-colors`}>In Stock</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`font-semibold ${darkMode ? "text-green-400" : "text-green-700"}`}>{inStock}</span>
              <span className={`text-xs ${darkMode ? "text-gray-400" : "text-blue-400"} font-medium`}>({getPercentage(inStock)}%)</span>
            </div>
          </div>
          <div className="flex items-center justify-between group">
            <div className="flex items-center">
              <div className={`w-4 h-4 bg-orange-400 rounded-full mr-3 border-2 ${darkMode ? "border-gray-600" : "border-blue-100"} group-hover:scale-110 transition-transform`}></div>
              <span className={`font-semibold ${darkMode ? "text-white hover:text-gray-200" : "text-blue-900 hover:text-blue-800"} transition-colors`}>Low Stock</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`font-semibold ${darkMode ? "text-orange-400" : "text-orange-600"}`}>{lowStock}</span>
              <span className={`text-xs ${darkMode ? "text-gray-400" : "text-blue-400"} font-medium`}>({getPercentage(lowStock)}%)</span>
            </div>
          </div>
          <div className="flex items-center justify-between group">
            <div className="flex items-center">
              <div className={`w-4 h-4 bg-red-500 rounded-full mr-3 border-2 ${darkMode ? "border-gray-600" : "border-blue-100"} group-hover:scale-110 transition-transform`}></div>
              <span className={`font-semibold ${darkMode ? "text-white hover:text-gray-200" : "text-blue-900 hover:text-blue-800"} transition-colors`}>Out of Stock</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`font-semibold ${darkMode ? "text-red-400" : "text-red-600"}`}>{outOfStock}</span>
              <span className={`text-xs ${darkMode ? "text-gray-400" : "text-blue-400"} font-medium`}>({getPercentage(outOfStock)}%)</span>
            </div>
          </div>
        </div>
        <div className={`mt-4 pt-4 border-t ${darkMode ? "border-gray-700" : "border-blue-100"}`}>
          <div className={`w-full ${darkMode ? "bg-gray-700" : "bg-blue-100"} rounded-full h-2 flex overflow-hidden`}>
            <div 
              className="bg-green-500 h-2 rounded-l-full"
              style={{ width: `${getPercentage(inStock)}%` }}
            ></div>
            <div 
              className="bg-orange-400 h-2"
              style={{ width: `${getPercentage(lowStock)}%` }}
            ></div>
            <div 
              className="bg-red-500 h-2 rounded-r-full"
              style={{ width: `${getPercentage(outOfStock)}%` }}
            ></div>
          </div>
        </div>
      </div>
    );
  };

  const RecentProducts = ({ products }: { products: Product[] }) => {
    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    // Get all recent products instead of just 5
    const recentProducts = [...products]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return (
      <div className={`${darkMode ? "bg-gray-800 hover:bg-gray-800/80" : "bg-white hover:bg-gray-50"} rounded-2xl shadow-xl border-2 ${darkMode ? "border-blue-900" : "border-blue-200"} hover:border-blue-500 p-6 transition-all duration-300`}>
        <div className="flex items-center mb-4">
          <div className="w-1.5 h-6 bg-blue-800 rounded-r-lg mr-3"></div>
          <span className={`${darkMode ? "text-blue-400" : "text-blue-700"} text-xl mr-2`}>🆕</span>
          <h3 className={`text-lg font-bold ${darkMode ? "text-white" : "text-blue-900"} tracking-wide`}>Recently Added Products</h3>
        </div>
        <div className="h-[400px] overflow-y-auto custom-scrollbar">
          <div className="space-y-3 pr-2">
            {recentProducts.map((product) => (
              <div key={product._id} className={`flex items-center justify-between py-2 border-b ${darkMode ? "border-gray-700" : "border-blue-100"} last:border-b-0 group ${darkMode ? "hover:bg-gray-700" : "hover:bg-blue-50"} rounded-lg transition-colors`}>
                <div className="flex-1">
                  <p className={`font-semibold text-sm ${darkMode ? "text-white group-hover:text-gray-200" : "text-blue-900 group-hover:text-blue-800"} transition-colors`}>{product.brand}</p>
                  <p className={`text-xs ${darkMode ? "text-gray-400" : "text-blue-700"} mb-1`}>{product.description}</p>
                  <p className={`text-xs ${darkMode ? "text-gray-500" : "text-blue-600"}`}>{product.category} • {product.stocks} in stock</p>
                </div>
                <div className="text-right">
                  <p className={`text-xs ${darkMode ? "text-gray-400" : "text-blue-400"} font-medium`}>{formatDate(product.createdAt)}</p>
                  <p className={`text-xs ${darkMode ? "text-gray-300" : "text-black"}`}>#{product.barcode}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        {products.length === 0 && (
          <div className="flex flex-col items-center justify-center py-6">
            <span className="text-4xl mb-2">📦</span>
            <p className={`text-base font-semibold ${darkMode ? "text-gray-300" : "text-blue-700"}`}>No recent products</p>
            <p className={`text-xs ${darkMode ? "text-gray-400" : "text-blue-600"}`}>Add new products to see them here!</p>
          </div>
        )}
      </div>
    );
  };

  const OutOfStockChart = ({ products }: { products: Product[] }) => {
    // Get all out of stock products
    const outOfStockProducts = products.filter(p => p.stocks === 0);

    return (
      <div className={`${darkMode ? "bg-gray-800 hover:bg-gray-800/80" : "bg-white hover:bg-gray-50"} rounded-2xl shadow-xl border-2 ${darkMode ? "border-blue-900" : "border-blue-200"} hover:border-blue-500 p-6 transition-all duration-300`}>
        <div className="flex items-center mb-4">
          <div className="w-1.5 h-6 bg-blue-800 rounded-r-lg mr-3"></div>
          <span className={`${darkMode ? "text-blue-400" : "text-blue-700"} text-xl mr-2`}>🚫</span>
          <h3 className={`text-lg font-bold ${darkMode ? "text-white" : "text-blue-900"} tracking-wide`}>Out of Stock Items</h3>
        </div>
        <div className="h-[400px] overflow-y-auto custom-scrollbar">
          <div className="space-y-4 pr-2">
            {outOfStockProducts.length > 0 ? (
              outOfStockProducts.map(product => (
                <div key={product._id} className="p-4 rounded-lg hover:bg-opacity-50 transition-all duration-200">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className={`font-semibold ${darkMode ? "text-white" : "text-blue-900"}`}>{product.brand}</span>
                      <p className={`text-sm ${darkMode ? "text-white" : "text-blue-600"}`}>{product.description}</p>
                    </div>
                    <div className="text-right">
                      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200">
                        Out of Stock
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className={`text-xs ${darkMode ? "text-white" : "text-blue-600"}`}>
                      Category: {product.category}
                    </span>
                    <span className={`text-xs ${darkMode ? "text-gray-400" : "text-blue-600"}`}>
                      Last updated: {new Date(product.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-6">
                <span className="text-4xl mb-2">✅</span>
                <p className={`text-base font-semibold ${darkMode ? "text-gray-300" : "text-green-700"}`}>No out of stock items</p>
                <p className={`text-xs ${darkMode ? "text-gray-400" : "text-green-600"}`}>All products are in stock</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const LowStockAlert = ({ products }: { products: Product[] }) => {
    // Get all low stock products instead of just 5
    const lowStockProducts = products.filter(p => p.stocks > 0 && p.stocks <= 10);

    return (
      <div className={`${darkMode ? "bg-gray-800 hover:bg-gray-800/80" : "bg-white hover:bg-gray-50"} rounded-2xl shadow-xl border-2 ${darkMode ? "border-blue-900" : "border-blue-200"} hover:border-blue-500 p-6 transition-all duration-300`}>
        <div className="flex items-center mb-4">
          <div className="w-1.5 h-6 bg-blue-800 rounded-r-lg mr-3"></div>
          <span className={`${darkMode ? "text-blue-400" : "text-blue-700"} text-xl mr-2`}>⚠️</span>
          <h3 className={`text-lg font-bold ${darkMode ? "text-white" : "text-blue-900"} tracking-wide`}>Low Stock Alerts</h3>
        </div>
        <div className="h-[400px] overflow-y-auto custom-scrollbar">
          <div className="space-y-3 pr-2">
            {lowStockProducts.map((product) => (
              <div key={product._id} className={`flex items-center justify-between py-2 border-b ${darkMode ? "border-gray-700" : "border-blue-100"} last:border-b-0 group ${darkMode ? "hover:bg-gray-700" : "hover:bg-blue-50"} rounded-lg transition-colors`}>
                <div className="flex-1">
                  <p className={`font-semibold text-sm ${darkMode ? "text-white group-hover:text-gray-200" : "text-blue-900 group-hover:text-blue-800"} transition-colors`}>{product.brand}</p>
                  <p className={`text-xs ${darkMode ? "text-gray-400" : "text-blue-700"}`}>{product.description}</p>
                  <p className={`text-xs ${darkMode ? "text-gray-500" : "text-blue-400"}`}>{product.category}</p>
                </div>
                <div className="text-right">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${darkMode ? "bg-orange-900/20 text-orange-400 border-orange-800" : "bg-orange-100 text-orange-800 border-orange-200"} border shadow-sm`}>
                    {product.stocks} left
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
        {lowStockProducts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-6">
            <span className="text-4xl mb-2">✅</span>
            <p className={`text-base font-semibold ${darkMode ? "text-gray-300" : "text-green-700"}`}>All products have sufficient stock</p>
            <p className={`text-xs ${darkMode ? "text-gray-400" : "text-green-600"}`}>No low stock alerts at the moment.</p>
          </div>
        )}
      </div>
    );
  };

  // if (loading) {
  //   return (
  //     <div className={`min-h-screen ${darkMode ? "bg-gray-500" : "bg-gray-50"} flex items-center justify-center`}>
  //       <div className="text-center">
  //         <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${darkMode ? "border-blue-400" : "border-blue-600"} mx-auto mb-4`}></div>
  //         <p className={`${darkMode ? "text-gray-400" : "text-gray-600"}`}>Loading dashboard data...</p>
  //       </div>
  //     </div>
  //   );
  // }

  // if (error) {
  //   return (
  //     <div className={`min-h-screen ${darkMode ? "bg-gray-900" : "bg-gray-50"} flex items-center justify-center`}>
  //       <div className="text-center">
  //         <div className={`${darkMode ? "text-red-400" : "text-red-500"} text-6xl mb-4`}>⚠️</div>
  //         <p className={`${darkMode ? "text-gray-400" : "text-gray-600"} mb-4`}>{error}</p>
  //         <button 
  //           onClick={fetchProducts}
  //           className={`${darkMode ? "bg-blue-600 hover:bg-blue-700" : "bg-blue-600 hover:bg-blue-700"} text-white px-4 py-2 rounded-lg transition-colors`}
  //         >
  //           Retry
  //         </button>
  //       </div>
  //     </div>
  //   );
  // }

  // Add global styles for custom scrollbar
  const globalStyles = `
    .custom-scrollbar::-webkit-scrollbar {
      width: 8px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: transparent;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background-color: ${darkMode ? '#374151' : '#bfdbfe'};
      border-radius: 20px;
      border: 2px solid transparent;
      background-clip: content-box;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background-color: ${darkMode ? '#4b5563' : '#93c5fd'};
    }
  `;

  if (!mounted) {
    return (
      <div className="min-h-screen bg-white transition-colors">
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={darkMode ? "min-h-screen bg-gray-900 text-white transition-colors" : "min-h-screen bg-white transition-colors"}>
      <style>{globalStyles}</style>
      {/* Page Header */}
      <div className={darkMode ? "bg-gradient-to-r from-blue-950 via-blue-900 to-blue-800 shadow-lg border-b border-blue-950" : "bg-gradient-to-r from-blue-900 via-blue-800 to-blue-700 shadow-lg border-b border-blue-900"}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className={darkMode ? "w-2 h-8 bg-blue-600 rounded-r-lg" : "w-2 h-8 bg-blue-400 rounded-r-lg"}></div>
                <h1 className="text-4xl font-extrabold text-white tracking-tight drop-shadow-lg">Dashboard</h1>
              </div>
              <p className={darkMode ? "text-blue-200 mt-1 text-lg font-medium tracking-wide" : "text-blue-100 mt-1 text-lg font-medium tracking-wide"}>Real-time inventory overview</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className={darkMode ? "text-xs text-blue-300 uppercase tracking-widest" : "text-xs text-blue-200 uppercase tracking-widest"}>Last updated</p>
                <p className="text-base font-semibold text-white drop-shadow">
                  {new Date().toLocaleString()}
                </p>
              </div>
              <button
                aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
                onClick={toggleDarkMode}
                className={
                  "ml-4 p-2 rounded-full border-2 " +
                  (darkMode ? "border-blue-400 bg-gray-800 hover:bg-gray-700" : "border-blue-800 bg-white hover:bg-blue-50") +
                  " transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                }
                title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
              >
                {darkMode ? (
                  <span className="text-yellow-300 text-xl" aria-hidden="true">🌙</span>
                ) : (
                  <span className="text-blue-800 text-xl" aria-hidden="true">☀️</span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={darkMode ? "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-white" : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"}>
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Products"
            value={stats.totalProducts.toLocaleString()}
            icon="📦"
            trend="up"
            trendValue="Live data"
            color="bg-blue-900"
            subtitle="Active inventory items"
          />
          <StatCard
            title="Low Stock Items"
            value={stats.lowStockItems}
            icon="⚠️"
            trend={stats.lowStockItems > 0 ? "down" : "neutral"}
            trendValue={stats.lowStockItems > 0 ? "Needs attention" : "All good"}
            color="bg-blue-700"
            subtitle="≤ 10 units remaining"
          />
          <StatCard
            title="Out of Stock"
            value={stats.outOfStockItems}
            icon="🚫"
            trend={stats.outOfStockItems > 0 ? "down" : "neutral"}
            trendValue={stats.outOfStockItems > 0 ? "Restock needed" : "Fully stocked"}
            color="bg-blue-600"
            subtitle="0 units available"
          />
          <StatCard
            title="Categories"
            value={Object.keys(stats.categories).length}
            icon="🏷️"
            trend="neutral"
            trendValue="Product types"
            color="bg-blue-500"
            subtitle="Different product categories"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Stock Status Chart */}
          <StockStatusChart products={products} />

          {/* Category Chart */}
          <CategoryChart categories={stats.categories} />
        </div>

        {/* Stock Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Most Stocked Out Items Chart */}
          <div className={`${darkMode ? "bg-gray-800 hover:bg-gray-800/80" : "bg-white hover:bg-gray-50"} rounded-2xl shadow-xl border-2 ${darkMode ? "border-blue-900" : "border-blue-200"} hover:border-blue-500 p-6 transition-all duration-300`}>
            <div className="flex items-center mb-4">
              <div className="w-1.5 h-6 bg-blue-800 rounded-r-lg mr-3"></div>
              <span className={`${darkMode ? "text-blue-400" : "text-blue-700"} text-xl mr-2`}>📉</span>
              <h3 className={`text-lg font-bold ${darkMode ? "text-white" : "text-blue-900"} tracking-wide`}>Most Stocked Out Items</h3>
            </div>
            <div className="h-[400px] overflow-y-auto custom-scrollbar">
              <div className="space-y-4 pr-2">
                {(() => {
                  // Calculate stock-out frequency for each product
                  const stockOutData = products.map(product => {
                    const stockOutTransactions = transactions.filter(t => 
                      t.product && t.product._id === product._id && 
                      (t.action === 'Stock Out' || t.action === 'stock_out' || t.action.toLowerCase().includes('out'))
                    );
                    const totalStockOut = stockOutTransactions.reduce((sum, t) => sum + (t.quantity || 0), 0);
                    const transactionCount = stockOutTransactions.length;
                    
                    return {
                      ...product,
                      totalStockOut,
                      transactionCount
                    };
                  }).filter(item => item.totalStockOut > 0)
                    .sort((a, b) => b.totalStockOut - a.totalStockOut)
                    .slice(0, 10);

                  const maxStockOut = stockOutData.length > 0 ? Math.max(...stockOutData.map(item => item.totalStockOut)) : 0;

                  return stockOutData.length > 0 ? (
                    stockOutData.map((product, index) => {
                      const percentage = maxStockOut > 0 ? Math.round((product.totalStockOut / maxStockOut) * 100) : 0;
                      
                      return (
                        <div key={product._id} className="p-4 rounded-lg hover:bg-opacity-50 transition-all duration-200">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <span className={`font-semibold ${darkMode ? "text-white" : "text-blue-900"}`}>{product.brand}</span>
                              <p className={`text-sm ${darkMode ? "text-gray-300" : "text-blue-600"}`}>{product.description}</p>
                            </div>
                            <div className="text-right">
                              <span className={`text-lg font-bold ${darkMode ? "text-red-400" : "text-red-600"}`}>
                                {product.totalStockOut}
                              </span>
                              <p className={`text-xs ${darkMode ? "text-gray-400" : "text-blue-600"}`}>units out</p>
                            </div>
                          </div>
                          <div className="relative pt-1">
                            <div className={`overflow-hidden h-2 text-xs flex rounded ${darkMode ? "bg-gray-700" : "bg-blue-100"}`}>
                              <div
                                style={{ width: `${percentage}%` }}
                                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-red-600 transition-all duration-500"
                              ></div>
                            </div>
                            <div className="flex justify-between mt-1">
                              <span className={`text-xs ${darkMode ? "text-gray-300" : "text-blue-600"}`}>
                                Category: {product.category} • {product.transactionCount} transactions
                              </span>
                              <span className={`text-xs ${darkMode ? "text-gray-400" : "text-blue-600"}`}>
                                Current stock: {product.stocks}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="flex flex-col items-center justify-center py-6">
                      <span className="text-4xl mb-2">📊</span>
                      <p className={`text-base font-semibold ${darkMode ? "text-gray-300" : "text-blue-700"}`}>No stock-out transactions found</p>
                      <p className={`text-xs ${darkMode ? "text-gray-400" : "text-blue-600"}`}>Stock-out history will appear here when transactions occur</p>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
          
          {/* Out of Stock Chart */}
          <OutOfStockChart products={products} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Products */}
          <RecentProducts products={products} />

          {/* Low Stock Alerts */}
          <LowStockAlert products={products} />
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-blue-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button 
              aria-label="View All Products"
              onClick={() => window.location.href = '/products'}
              className="bg-blue-800 border border-blue-900 rounded-lg p-4 hover:shadow-lg transition-shadow text-left text-white hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <div className="text-2xl mb-2" aria-hidden="true">📋</div>
              <h3 className="font-medium text-white">View All Products</h3>
              <p className="text-sm text-blue-100">Manage your inventory</p>
            </button>
            <button 
              aria-label="Add New Product"
              onClick={() => window.location.href = '/products?add=true'}
              className="bg-blue-800 border border-blue-900 rounded-lg p-4 hover:shadow-lg transition-shadow text-left text-white hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <div className="text-2xl mb-2" aria-hidden="true">➕</div>
              <h3 className="font-medium text-white">Add New Product</h3>
              <p className="text-sm text-blue-100">Expand your inventory</p>
            </button>
            <button 
              aria-label="Low Stock Items"
              onClick={() => window.location.href = '/products?filter=low-stock'}
              className="bg-blue-800 border border-blue-900 rounded-lg p-4 hover:shadow-lg transition-shadow text-left text-white hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <div className="text-2xl mb-2" aria-hidden="true">⚠️</div>
              <h3 className="font-medium text-white">Low Stock Items</h3>
              <p className="text-sm text-blue-100">Review and restock</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
