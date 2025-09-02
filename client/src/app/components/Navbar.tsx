'use client';


import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Navbar() {
  const pathname = usePathname();
  // Sync with dashboard dark mode
  const [darkMode, setDarkMode] = useState(false);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = window.localStorage.getItem('dashboard-dark-mode');
      setDarkMode(stored === 'true');
      // Listen for changes from other tabs/windows
      const handler = (e: StorageEvent) => {
        if (e.key === 'dashboard-dark-mode') {
          setDarkMode(e.newValue === 'true');
        }
      };
      window.addEventListener('storage', handler);
      return () => window.removeEventListener('storage', handler);
    }
  }, []);

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/products', label: 'Products', icon: '📦' },
    { href: '/archived', label: 'Archived', icon: '🗂️' },
    { href: '/transaction', label: 'Transaction', icon: '📜' },
    // { href: '/settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <nav className={darkMode ? "bg-gray-900 shadow-sm border-b border-gray-800" : "bg-white shadow-sm border-b border-gray-200"}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/dashboard" className="flex items-center">
              <span className="text-2xl mr-2">🏭</span>
              <span className={darkMode ? "text-xl font-bold text-white" : "text-xl font-bold text-gray-900"}>MOM TRADING AND SERVICES </span>
            </Link>
          </div>
          
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                      isActive
                        ? (darkMode ? 'bg-blue-900 text-blue-100' : 'bg-blue-100 text-blue-700')
                        : (darkMode ? 'text-gray-300 hover:text-white hover:bg-gray-800' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50')
                    }`}
                  >
                    <span className="mr-2">{item.icon}</span>
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="md:hidden">
            <button className={darkMode ? "text-gray-300 hover:text-white" : "text-gray-600 hover:text-gray-900"}>
              <span className="text-xl">☰</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
