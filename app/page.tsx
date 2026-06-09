import fs from 'fs';
import path from 'path';
import Navbar from '@/components/Navbar';
import ProductCard from '@/components/ProductCard';

export default function Home() {
  const productsDir = path.join(process.cwd(), 'data', 'products');
  const imagesDir = path.join(process.cwd(), 'public', 'images');
  
  // প্রোডাক্ট ফাইল রিড করা
  const files = fs.readdirSync(productsDir).filter(file => file.endsWith('.txt'));
  const imageFiles = fs.readdirSync(imagesDir);

  const products = files.map(file => {
    const content = fs.readFileSync(path.join(productsDir, file), 'utf-8');
    const lines = content.split('\n');
    const baseName = file.replace('.txt', '');
    
    // ফাইলের নামের সাথে মিল রেখে ছবি খুঁজে বের করা (যেকোনো ফরম্যাট: jpg, jpeg, png)
    const matchedImage = imageFiles.find(img => img.startsWith(baseName)) || 'default.jpg';

    return {
      id: baseName,
      title: lines[0].replace('প্রোডাক্টের নাম: ', '').trim(),
      price: lines[1].replace('দাম: ', '').trim(),
      image: `/images/${matchedImage}`
    };
  });

  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />
      <section className="px-6 py-12 md:px-20 md:py-24">
        <h2 className="text-4xl md:text-6xl font-extralight mb-16 tracking-tighter">Collection</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
          {products.map((p) => (
            <ProductCard key={p.id} title={p.title} price={p.price} image={p.image} />
          ))}
        </div>
      </section>
    </main>
  );
}
