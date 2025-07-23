import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/Providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Medical Image Analysis Platform',
  description: 'AI-powered medical image analysis with real-time processing',
  keywords: ['medical imaging', 'AI analysis', 'healthcare', 'DICOM'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
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
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-500">Demo Mode</span>
                  </div>
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
