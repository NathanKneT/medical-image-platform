'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/Providers';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);

  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  const isAuthenticated = !!token;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && !isAuthenticated && pathname !== '/login') {
      router.push('/login');
    }
  }, [pathname, router, isMounted, isAuthenticated]);


  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    router.push('/login');
    toast.success("You have been logged out.");
  };
  
  // Render a loading state on the server or before the client-side check is complete
  if (!isMounted) {
    return (
      <html lang="en">
        <body className={inter.className}>
          <div>Loading...</div>
        </body>
      </html>
    );
  }

  return (
    <html lang="en" className="h-full">
      <head>
        <title>Medical Image Analysis Platform</title>
      </head>
      <body className={`${inter.className} h-full bg-gray-50`} suppressHydrationWarning={true}>
        <Providers>
          {pathname === '/login' ? (
            <>{children}</>
          ) : (
            <>
              {isAuthenticated ? (
                <div className="min-h-full">
                  <nav className="bg-white shadow">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                      <div className="flex justify-between h-16">
                        <div className="flex items-center">
                          <h1 className="text-xl font-semibold text-gray-900">
                            Medical Analysis Platform
                          </h1>
                        </div>

                        <div className="flex items-center space-x-4">
                          <span className="text-sm text-gray-500">User: demo@rokken.com (Admin)</span>
                          <Button variant="outline" size="sm" onClick={handleLogout}>Logout</Button>
                        </div>
                      </div>
                    </div>
                  </nav>
                  <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                    {children}
                  </main>
                </div>
              ) : (
                <div>Loading...</div>
              )}
            </>
          )}
        </Providers>
      </body>
    </html>
  );
}