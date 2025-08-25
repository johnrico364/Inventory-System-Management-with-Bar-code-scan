import type { Metadata } from "next";
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import "./globals.css";
import Navbar from "./components/Navbar";
import { DarkModeProvider } from './context/DarkModeContext';

export const metadata: Metadata = {
  title: "Inventory System",
  description: "Manage your inventory efficiently",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Ensure the Geist Sans and Mono fonts are applied globally  
  return (
    <html lang="en">
      <body className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}>
        <DarkModeProvider>
          <div className="min-h-screen">
            <Navbar />
            {children}
          </div>
        </DarkModeProvider>
      </body>
    </html>
  );
}
