'use client';

import { useState, useEffect } from 'react';

interface InventoryStats {
  totalProducts: number;
  lowStockItems: number;
  totalValue: number;
  recentTransactions: number;
}

interface RecentActivity {
  id: string;
  type: 'added' | 'removed' | 'updated';
  product: string;
  quantity: number;
  timestamp: string;
}

interface ChartData {
  month: string;
  products: number;
  value: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<InventoryStats>({
    totalProducts: 0,
    lowStockItems: 0,
    totalValue: 0,
    recentTransactions: 0
  });

  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading data
    setTimeout(() => {
      setStats({
        totalProducts: 1247,
        lowStockItems: 23,
        totalValue: 45678,
        recentTransactions: 89
      });

      setRecentActivity([
        {
          id: '1',
          type: 'added',
          product: 'Laptop Dell XPS 13',
          quantity: 5,
          timestamp: '2 minutes ago'
        },
        {
          id: '2',
          type: 'removed',
          product: 'iPhone 15 Pro',
          quantity: 2,
          timestamp: '15 minutes ago'
        },
        {
          id: '3',
          type: 'updated',
          product: 'Samsung Galaxy S24',
          quantity: 10,
          timestamp: '1 hour ago'
        },
        {
          id: '4',
          type: 'added',
          product: 'MacBook Air M2',
          quantity: 3,
          timestamp: '2 hours ago'
        }
      ]);

      setChartData([
        { month: 'Jan', products: 1200, value: 42000 },
        { month: 'Feb', products: 1250, value: 43500 },
        { month: 'Mar', products: 1180, value: 41000 },
        { month: 'Apr', products: 1320, value: 46000 },
        { month: 'May', products: 1280, value: 44500 },
        { month: 'Jun', products: 1247, value: 45678 }
      ]);

      setLoading(false);
    }, 1000);
  }, []);

  const StatCard = ({ title, value, icon, trend, trendValue, color }: {
    title: string;
    value: string | number;
    icon: string;
    trend?: 'up' | 'down';
    trendValue?: string;
    color: string;
  }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {trend && (
            <div className="flex items-center mt-2">
              {trend === 'up' ? (
                <span className="text-green-500">↗</span>
              ) : (
                <span className="text-red-500">↘</span>
              )}
              <span className={`text-sm ml-1 ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
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

  const SimpleChart = ({ data }: { data: ChartData[] }) => {
    const maxValue = Math.max(...data.map(d => d.value));
    const maxProducts = Math.max(...data.map(d => d.products));

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Inventory Trends (Last 6 Months)</h3>
        <div className="space-y-4">
          {data.map((item, index) => {
            const valueHeight = (item.value / maxValue) * 100;
            const productHeight = (item.products / maxProducts) * 100;
            
            return (
              <div key={index} className="flex items-end space-x-2">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{item.month}</span>
                    <span className="text-xs text-gray-500">${item.value.toLocaleString()}</span>
                  </div>
                  <div className="relative h-20 bg-gray-100 rounded">
                    <div 
                      className="absolute bottom-0 left-0 bg-blue-500 rounded-t"
                      style={{ width: '100%', height: `${valueHeight}%` }}
                    ></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-medium text-gray-700">{item.products} items</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex items-center justify-center space-x-4 text-sm text-gray-600">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded mr-2"></div>
            <span>Total Value</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-gray-400 rounded mr-2"></div>
            <span>Product Count</span>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
              <p className="text-gray-600 mt-1">Inventory Management Overview</p>
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
            trendValue="+12% from last month"
            color="bg-blue-500"
          />
          <StatCard
            title="Low Stock Items"
            value={stats.lowStockItems}
            icon="⚠️"
            trend="down"
            trendValue="-5% from last week"
            color="bg-orange-500"
          />
          <StatCard
            title="Total Value"
            value={`$${stats.totalValue.toLocaleString()}`}
            icon="📈"
            trend="up"
            trendValue="+8% from last month"
            color="bg-green-500"
          />
          <StatCard
            title="Recent Transactions"
            value={stats.recentTransactions}
            icon="👥"
            trend="up"
            trendValue="+15% from yesterday"
            color="bg-purple-500"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Chart */}
          <div>
            <SimpleChart data={chartData} />
          </div>

          {/* Recent Activity */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6">
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                      <div className="flex items-center">
                        <div className={`w-2 h-2 rounded-full mr-3 ${
                          activity.type === 'added' ? 'bg-green-500' :
                          activity.type === 'removed' ? 'bg-red-500' : 'bg-blue-500'
                        }`} />
                        <div>
                          <p className="font-medium text-gray-900">
                            {activity.product}
                          </p>
                          <p className="text-sm text-gray-600">
                            {activity.type === 'added' ? 'Added' : 
                             activity.type === 'removed' ? 'Removed' : 'Updated'} {activity.quantity} units
                          </p>
                        </div>
                      </div>
                      <span className="text-sm text-gray-500">{activity.timestamp}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <span className="text-gray-500 text-sm">Showing last 4 activities</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Data Section */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Inventory Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Top Categories</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Electronics</span>
                  <span className="font-medium">45%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Clothing</span>
                  <span className="font-medium">30%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Books</span>
                  <span className="font-medium">15%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Others</span>
                  <span className="font-medium">10%</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Stock Status</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">In Stock</span>
                  <span className="font-medium text-green-600">1,180</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Low Stock</span>
                  <span className="font-medium text-orange-600">23</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Out of Stock</span>
                  <span className="font-medium text-red-600">44</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Monthly Overview</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Products Added</span>
                  <span className="font-medium text-green-600">+156</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Products Sold</span>
                  <span className="font-medium text-blue-600">-89</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Net Change</span>
                  <span className="font-medium text-green-600">+67</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
