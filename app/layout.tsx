import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function RootLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  return (
    <html lang="bn">
      <body className="bg-black text-white antialiased">
        <Navbar />   {/* ← এখানে Navbar যোগ করুন */}

        <main className="min-h-screen">
          {children}
        </main>

        <Footer />
      </body>
    </html>
  );
}