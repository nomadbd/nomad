import fs from 'fs';
import path from 'path';
import Navbar from '@/components/Navbar';
import ProductCard from '@/components/ProductCard';

export default function Home() {
  const productsDir = path.join(process.cwd(), 'data', 'products');
  const imagesDir = path.join(process.cwd(), 'public', 'images');
  
  // ফাইলগুলো না থাকলে এরর এড়াতে চেক
  const files = fs.existsSync(productsDir) ? fs.readdirSync(productsDir).filter(f => f.endsWith('.txt')) : [];
  const imageFiles = fs.existsSync(imagesDir) ? fs.readdirSync(imagesDir) : [];

  const products = files.map(file => {
    const content = fs.readFileSync(path.join(productsDir, file), 'utf-8');
    const lines = content.split('\n');
    const baseName = file.replace('.txt', '');
    const matchedImage = imageFiles.find(img => img.startsWith(baseName)) || 'default.jpg';

    return {
      id: baseName,
      title: lines[0]?.replace('প্রোডাক্টের নাম: ', '').trim() || 'Product',
      price: lines[1]?.replace('দাম: ', '').trim() || '0',
      image: `/images/${matchedImage}`
    };
  });

  return (
    <main className="min-h-screen bg-black text-white selection:bg-white selection:text-black">
      <Navbar />
      <div className="max-w-7xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-light mb-12">Latest Collection</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((p) => <ProductCard key={p.id} {...p} />)}
        </div>
      </div>
    </main>
  );
}
