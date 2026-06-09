import fs from 'fs';
import path from 'path';
import Navbar from '@/components/Navbar';
import ProductCard from '@/components/ProductCard';

export default function Home() {
  // ডাটা ফোল্ডার থেকে ফাইল রিড করা
  const productsDir = path.join(process.cwd(), 'data', 'products');
  const files = fs.readdirSync(productsDir).filter(file => file.endsWith('.txt'));

  const products = files.map(file => {
    const content = fs.readFileSync(path.join(productsDir, file), 'utf-8');
    const lines = content.split('\n');
    return {
      id: file.replace('.txt', ''),
      title: lines[0].replace('প্রোডাক্টের নাম: ', ''), // ফাইলের প্রথম লাইন থেকে নাম
      price: lines[1].replace('দাম: ', ''),           // দ্বিতীয় লাইন থেকে দাম
      image: `/images/${file.replace('.txt', '.jpg')}` // ইমেজ পাথ
    };
  });

  return (
    <main className="min-h-screen">
      <Navbar />
      <section className="px-10 py-20">
        <h2 className="text-5xl font-extralight mb-12">Collection</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {products.map((p) => (
            <ProductCard key={p.id} title={p.title} price={p.price} image={p.image} />
          ))}
        </div>
      </section>
    </main>
  );
}
