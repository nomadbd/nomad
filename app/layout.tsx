import './globals.css';
import Footer from '@/components/Footer'; // ফুটার ফাইলটি ইমপোর্ট করা হলো

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-black text-white antialiased">
        {/* মেইন কন্টেন্ট */}
        <main className="min-h-screen">
          {children}
        </main>
        
        {/* সব পেজের নিচে ফুটার */}
        <Footer />
      </body>
    </html>
  );
}
