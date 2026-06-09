// app/page.tsx
import Navbar from '@/components/Navbar';
import ProductCard from '@/components/ProductCard';

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <section className="px-10 py-20">
        <h2 className="text-5xl font-extralight mb-12">Collection</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <ProductCard title="NOMAD Signature" price="2500" image="/product1.jpg" />
          <ProductCard title="Urban Jacket" price="4200" image="/product2.jpg" />
        </div>
      </section>
      <footer className="px-10 py-10 border-t border-zinc-900 text-center">
        <p className="text-zinc-600">WhatsApp for Payment/Order: 01521731371</p>
      </footer>
    </main>
  );
}
