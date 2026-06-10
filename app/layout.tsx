// app/layout.tsx 

import './globals.css';
import Navbar from '@/components/Navbar'; // Navbar ইমপোর্ট করা হলো
import Footer from '@/components/Footer';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-black text-white antialiased">
        <Navbar /> {/*Navbar এখানে থাকবে */}
        
        <main className="min-h-screen">
          {children}
        </main>
        
        <Footer />
      </body>
    </html>
  );
}
