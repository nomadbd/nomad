// app/layout.tsx 
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-black text-white antialiased">
        <Navbar />

        <main className="min-h-screen">
          {children}
        </main>

        {/* আমরা এখানে একটি কী (key) যোগ করছি যা রিয়্যাক্টকে বাধ্য করবে নতুন করে রেন্ডার করতে */}
        <Footer key="footer-v1" /> 
      </body>
    </html>
  );
}
