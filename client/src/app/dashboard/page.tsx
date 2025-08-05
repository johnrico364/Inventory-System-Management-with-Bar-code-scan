'use client';

import { useState, useEffect } from 'react';

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

export default function Dashboard() {
  const [products, setProducts] = useState<Product[]>([]);
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

  useEffect(() => {
    fetchProducts();
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
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
          {trend && trendValue && (
            <div className="flex items-center mt-2">
              {trend === 'up' ? (
                <span className="text-green-500">↗</span>
              ) : trend === 'down' ? (
                <span className="text-red-500">↘</span>
              ) : (
                <span className="text-gray-500">→</span>
              )}
              <span className={`text-sm ml-1 ${
                trend === 'up' ? 'text-green-600' : 
                trend === 'down' ? 'text-red-600' : 'text-gray-600'
              }`}>
                {trendValue}
              </span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color} text-white text-2xl`}>
          {icon}
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

    const colors = ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-red-500'];

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Categories</h3>
        <div className="space-y-3">
          {categoryData.map((category, index) => (
            <div key={category.name} className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full ${colors[index % colors.length]} mr-3`}></div>
                <span className="text-gray-700 font-medium">{category.name}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-gray-600">{category.count} items</span>
                <span className="text-sm text-gray-500">({category.percentage}%)</span>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex justify-between text-sm text-gray-600">
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
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Stock Status Overview</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
              <span className="text-gray-700">In Stock</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-medium text-green-600">{inStock}</span>
              <span className="text-sm text-gray-500">({getPercentage(inStock)}%)</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-orange-500 rounded-full mr-3"></div>
              <span className="text-gray-700">Low Stock</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-medium text-orange-600">{lowStock}</span>
              <span className="text-sm text-gray-500">({getPercentage(lowStock)}%)</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
              <span className="text-gray-700">Out of Stock</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-medium text-red-600">{outOfStock}</span>
              <span className="text-sm text-gray-500">({getPercentage(outOfStock)}%)</span>
            </div>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-500 h-2 rounded-full" 
              style={{ width: `${getPercentage(inStock)}%` }}
            ></div>
            <div 
              className="bg-orange-500 h-2 rounded-full -mt-2" 
              style={{ width: `${getPercentage(lowStock)}%`, marginLeft: `${getPercentage(inStock)}%` }}
            ></div>
            <div 
              className="bg-red-500 h-2 rounded-full -mt-2" 
              style={{ width: `${getPercentage(outOfStock)}%`, marginLeft: `${getPercentage(inStock) + getPercentage(lowStock)}%` }}
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

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recently Added Products</h3>
        <div className="space-y-3">
          {products.map((product) => (
            <div key={product._id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
              <div className="flex-1">
                <p className="font-medium text-gray-900 text-sm">{product.brand}</p>
                <p className="text-xs text-gray-600">{product.category} • {product.stocks} in stock</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">{formatDate(product.createdAt)}</p>
                <p className="text-xs text-gray-400">#{product.barcode}</p>
              </div>
            </div>
          ))}
        </div>
        {products.length === 0 && (
          <p className="text-gray-500 text-sm text-center py-4">No recent products</p>
        )}
      </div>
    );
  };

  const LowStockAlert = ({ products }: { products: Product[] }) => {
    const lowStockProducts = products.filter(p => p.stocks > 0 && p.stocks <= 10).slice(0, 5);

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Low Stock Alerts</h3>
        <div className="space-y-3">
          {lowStockProducts.map((product) => (
            <div key={product._id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
              <div className="flex-1">
                <p className="font-medium text-gray-900 text-sm">{product.brand}</p>
                <p className="text-xs text-gray-600">{product.description}</p>
                <p className="text-xs text-gray-500">{product.category}</p>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                  {product.stocks} left
                </span>
              </div>
            </div>
          ))}
        </div>
        {lowStockProducts.length === 0 && (
          <p className="text-green-600 text-sm text-center py-4">✅ All products have sufficient stock</p>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={fetchProducts}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600 mt-1">Real-time inventory overview</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Last updated</p>
              <p className="text-sm font-medium text-gray-900">
                {new Date().toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Products"
            value={stats.totalProducts.toLocaleString()}
            icon="📦"
            trend="up"
            trendValue="Live data"
            color="bg-blue-500"
            subtitle="Active inventory items"
          />
          <StatCard
            title="Low Stock Items"
            value={stats.lowStockItems}
            icon="⚠️"
            trend={stats.lowStockItems > 0 ? "down" : "neutral"}
            trendValue={stats.lowStockItems > 0 ? "Needs attention" : "All good"}
            color="bg-orange-500"
            subtitle="≤ 10 units remaining"
          />
          <StatCard
            title="Out of Stock"
            value={stats.outOfStockItems}
            icon="🚫"
            trend={stats.outOfStockItems > 0 ? "down" : "neutral"}
            trendValue={stats.outOfStockItems > 0 ? "Restock needed" : "Fully stocked"}
            color="bg-red-500"
            subtitle="0 units available"
          />
          <StatCard
            title="Categories"
            value={Object.keys(stats.categories).length}
            icon="🏷️"
            trend="neutral"
            trendValue="Product types"
            color="bg-purple-500"
            subtitle="Different product categories"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Stock Status Chart */}
          <StockStatusChart products={products} />

          {/* Category Chart */}
          <CategoryChart categories={stats.categories} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Products */}
          <RecentProducts products={stats.recentProducts} />

          {/* Low Stock Alerts */}
          <LowStockAlert products={products} />
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button 
              onClick={() => window.location.href = '/products'}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow text-left"
            >
              <div className="text-2xl mb-2">📋</div>
              <h3 className="font-medium text-gray-900">View All Products</h3>
              <p className="text-sm text-gray-600">Manage your inventory</p>
            </button>
            <button 
              onClick={() => window.location.href = '/products?add=true'}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow text-left"
            >
              <div className="text-2xl mb-2">➕</div>
              <h3 className="font-medium text-gray-900">Add New Product</h3>
              <p className="text-sm text-gray-600">Expand your inventory</p>
            </button>
            <button 
              onClick={() => window.location.href = '/products?filter=low-stock'}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow text-left"
            >
              <div className="text-2xl mb-2">⚠️</div>
              <h3 className="font-medium text-gray-900">Low Stock Items</h3>
              <p className="text-sm text-gray-600">Review and restock</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
