import fs from 'fs';
import path from 'path';
import Navbar from '@/components/Navbar';
import ProductCard from '@/components/ProductCard';

export default function Home() {
  const productsDir = path.join(process.cwd(), 'data', 'products');
  const imagesDir = path.join(process.cwd(), 'public', 'images');

  // প্রোডাক্ট ফাইল রিড করা
  const files = fs.existsSync(productsDir) 
    ? fs.readdirSync(productsDir).filter(f => f.endsWith('.txt')) 
    : [];

  // ইমেজের সব ফাইল একবার রিড করে রাখা (পারফরম্যান্সের জন্য)
  const allImages = fs.existsSync(imagesDir) ? fs.readdirSync(imagesDir) : [];

  const products = files.map(file => {
    const content = fs.readFileSync(path.join(productsDir, file), 'utf-8');
    const lines = content.split('\n');
    const baseName = file.replace('.txt', '');

    // বাগ ফিক্স: এক্সটেনশন ছাড়া ফাইলের নাম দিয়ে ছবি খোঁজা
    const matchedImage = allImages.find(img => {
      const fileNameWithoutExt = path.parse(img).name;
      return fileNameWithoutExt === baseName;
    }) || 'default.jpg'; // ছবি না থাকলে default.jpg দেখাবে

    return {
      id: baseName,
      title: lines[0]?.replace('প্রোডাক্টের নাম: ', '').trim() || 'Product',
      price: lines[1]?.replace('দাম: ', '').trim() || '0',
      image: `/images/${matchedImage}`
    };
  });

  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />
      <div className="p-4 md:p-10 max-w-7xl mx-auto">
        <h2 className="text-2xl font-light mb-8">Latest Collection</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {products.map((p) => (
            <ProductCard key={p.id} {...p} />
          ))}
        </div>
      </div>
    </main>
  );
}
