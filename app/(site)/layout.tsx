import type { Metadata } from 'next';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import './globals.css';

export const metadata: Metadata = {
  title: 'NOMAD - The one. Everywhere.',
  description: 'Premium Fashion Brand',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="bn">
      <body className="font-sans antialiased">
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}