'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from "../components/Navbar";

export default function HomeLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();

  useEffect(() => {
    // Check login status from sessionStorage
    const user = JSON.parse(sessionStorage.getItem('user') || '{}');
    if (!user.isLoggedIn) {
      router.push('/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen">
      <Navbar />
      {children}
    </div>
  );
}
