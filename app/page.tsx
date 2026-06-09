import fs from 'fs';
import path from 'path';
import Navbar from '@/components/Navbar';
import ProductCard from '@/components/ProductCard';

export default function Home() {
  const productsDir = path.join(process.cwd(), 'data', 'products');
  const files = fs.readdirSync(productsDir).filter(file => file.endsWith('.txt'));

  const products = files.map(file => {
    const content = fs.readFileSync(path.join(productsDir, file), 'utf-8');
    const lines = content.split('\n');
    
    // ইমেজ এক্সটেনশন খোঁজা (jpg বা jpeg সাপোর্ট করার জন্য)
    const baseName = file.replace('.txt', '');
    const imagePath = `/images/${baseName}.jpg`; // প্রয়োজনে .jpeg চেক করার লজিক এখানে যোগ করা যায়
    
    return {
      id: baseName,
      title: lines[0].replace('প্রোডাক্টের নাম: ', ''),
      price: lines[1].replace('দাম: ', ''),
      image: imagePath 
    };
  });

  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />
      <section className="px-4 py-10 md:px-10 md:py-20">
        <h2 className="text-3xl md:text-5xl font-extralight mb-8 md:mb-12">Collection</h2>
        
        {/* মোবাইলে ১ কলাম, ট্যাবলেটে ২, বড় স্ক্রিনে ৩ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10">
          {products.map((p) => (
            <ProductCard key={p.id} title={p.title} price={p.price} image={p.image} />
          ))}
        </div>
      </section>
    </main>
  );
}
