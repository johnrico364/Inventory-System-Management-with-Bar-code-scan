import type { Metadata } from "next";
import "./globals.css";
import Navbar from "./components/Navbar";
import { DarkModeProvider } from "./context/DarkModeContext";

export const metadata: Metadata = {
  title: "Inventory System",
  description: "Manage your inventory efficiently",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <DarkModeProvider>
          <div className="min-h-screen">
            {/* <Navbar /> */}
            {children}
          </div>
        </DarkModeProvider>
      </body>
    </html>
  );
}
