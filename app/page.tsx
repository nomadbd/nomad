import fs from 'fs';
import path from 'path';
import Navbar from '@/components/Navbar';
import ProductCard from '@/components/ProductCard';

export default function Home() {
  const productsDir = path.join(process.cwd(), 'data', 'products');
  const files = fs.existsSync(productsDir) ? fs.readdirSync(productsDir).filter(f => f.endsWith('.txt')) : [];

  const products = files.map(file => {
    const content = fs.readFileSync(path.join(productsDir, file), 'utf-8');
    const lines = content.split('\n');
    return {
      id: file.replace('.txt', ''),
      title: lines[0]?.replace('প্রোডাক্টের নাম: ', '').trim(),
      price: lines[1]?.replace('দাম: ', '').trim(),
      image: `/images/${file.replace('.txt', '.jpg')}`
    };
  });

  return (
    <main className="min-h-screen bg-black">
      <Navbar />
      <div className="p-4 md:p-10">
        <h2 className="text-2xl font-light mb-6">Latest Collection</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((p) => <ProductCard key={p.id} {...p} />)}
        </div>
      </div>
    </main>
  );
}
