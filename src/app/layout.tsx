import type { Metadata } from 'next';
import { Nunito } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileNav } from '@/components/layout/MobileNav';
import { SubscriptionBanner } from '@/components/layout/SubscriptionBanner';

const nunito = Nunito({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-nunito',
});

export const metadata: Metadata = {
  title: 'Kasir - Aplikasi Kasir UMKM & Warung Modern',
  description: 'Aplikasi kasir (POS) berbasis web modern, ringan, cepat, dan mudah digunakan untuk manajemen toko & transaksi UMKM.',
  manifest: '/manifest.json',
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`dark ${nunito.variable}`}>
      <body className="bg-slate-950 text-slate-100 min-h-screen flex flex-col font-sans">
        <AuthProvider>
          <Navbar />
          <SubscriptionBanner />
          <div className="flex flex-1 min-h-[calc(100vh-57px)] pb-16 md:pb-0">
            <Sidebar />
            <main className="flex-1 p-3 md:p-6 overflow-y-auto max-w-7xl mx-auto w-full">
              {children}
            </main>
          </div>
          <MobileNav />
        </AuthProvider>
      </body>
    </html>
  );
}
