'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/Providers';
import { Button } from '@/components/ui/button'; // Make sure Button is imported
import toast from 'react-hot-toast'; // Make sure toast is imported

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // Check for the token when the component mounts on the client
    const token = localStorage.getItem('accessToken');
    setIsAuthenticated(!!token);
  }, []);

  useEffect(() => {
    if (isMounted) {
      const token = localStorage.getItem('accessToken');
      setIsAuthenticated(!!token);

      if (!token && pathname !== '/login') {
        router.push('/login');
      }
    }
  }, [pathname, router, isMounted]);

  // To prevent rendering protected content on the server or before the client-side check
  if (!isMounted) {
      return (
          <html lang="en">
              <body className={inter.className}>
                  <div>Loading...</div>
              </body>
          </html>
      )
  }
  
  // If we are on the login page, render it without the main layout chrome
  if (pathname === '/login') {
      return (
        <html lang="en" className="h-full">
            <body className={`${inter.className} h-full bg-gray-50`} suppressHydrationWarning={true}>
                <Providers>{children}</Providers>
            </body>
        </html>
      );
  }

  // If the page is protected and we are not authenticated yet, show a loading state
  if (!isAuthenticated && pathname !== '/login') {
      return (
        <html lang="en">
            <body className={inter.className}>
                <div>Loading...</div>
            </body>
        </html>
      )
  }


  const handleLogout = () => {
      localStorage.removeItem('accessToken');
      setIsAuthenticated(false); // Update state immediately
      router.push('/login');
      toast.success("You have been logged out.");
  }

  return (
    <html lang="en" className="h-full">
      <head>
          <title>Medical Image Analysis Platform</title>
      </head>
      <body className={`${inter.className} h-full bg-gray-50`} suppressHydrationWarning={true}>
        <Providers>
          <div className="min-h-full">
            <nav className="bg-white shadow">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                  <div className="flex items-center">
                    <h1 className="text-xl font-semibold text-gray-900">
                      Medical Image Analysis Platform
                    </h1>
                  </div>

                  {/* Conditionally render the user info and logout button */}
                  {isAuthenticated && (
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-gray-500">User: demo@rokken.com (Admin)</span>
                      <Button variant="outline" size="sm" onClick={handleLogout}>Logout</Button>
                    </div>
                  )}

                </div>
              </div>
            </nav>
            <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}