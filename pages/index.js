import React, { useState } from 'react';
import fs from 'fs';
import path from 'path';

export default function Home({ products }) {
  const [selectedProduct, setSelectedProduct] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openOrderForm = (productName) => {
    setSelectedProduct(productName);
    setIsModalOpen(true);
  };

  return (
    <div className="bg-[#0a0a0a] text-white min-h-screen font-sans flex flex-col selection:bg-white selection:text-black">
      
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-black/50 backdrop-blur-xl border-b border-white/5 px-8 py-6">
        <div className="max-w-7xl mx-auto flex flex-col items-center sm:items-start">
          <h1 className="text-3xl font-black tracking-[0.25em] leading-none">NOMAD</h1>
          <span className="text-[11px] italic text-zinc-400 mt-2">The one. Everywhere.</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow pt-48 pb-32 max-w-7xl mx-auto px-8 w-full">
        {(!products || products.length === 0) ? (
          <div className="flex items-center justify-center py-40 border border-white/[0.03] bg-zinc-900/10 rounded-[2rem]">
            <p className="text-zinc-500 text-lg font-light tracking-[0.2em] italic uppercase">
              Collections not available!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {products.map((product, index) => (
              <div key={index} className="group relative flex flex-col transition-all duration-700">
                <div className="aspect-[3/4] bg-zinc-900 overflow-hidden relative shadow-2xl transition-all duration-500">
                  {product.hasImage ? (
                    <img 
                      src={`/products/${product.image}`} 
                      alt={product.cleanName} 
                      className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-1000"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-800 uppercase font-bold">No Image</div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center">
                    <button 
                      onClick={() => openOrderForm(product.cleanName)}
                      className="bg-white text-black px-8 py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-red-600 hover:text-white transition-colors"
                    >
                      Buy Now
                    </button>
                  </div>
                </div>
                <div className="mt-6 space-y-2 text-center sm:text-left">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-200">{product.cleanName}</h3>
                  <p className="text-xs text-zinc-500 font-light italic">{product.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full py-12 border-t border-white/5 bg-black/20 text-center">
        <p className="text-[10px] tracking-[0.4em] uppercase text-zinc-500">Nomad by SH</p>
        <p className="text-[9px] text-zinc-600 mt-2">&copy; {new Date().getFullYear()} ALL RIGHTS RESERVED.</p>
      </footer>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-[#0f0f0f] w-full max-w-md p-10 relative border border-white/10 shadow-2xl">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-6 text-zinc-500 hover:text-white text-3xl font-light">&times;</button>
            <h3 className="text-lg font-bold uppercase tracking-[0.3em] mb-10 text-center">Order Form</h3>
            <form action="/api/order" method="POST" className="space-y-6">
              <input type="hidden" name="product" value={selectedProduct} />
              <div className="space-y-5">
                <input type="text" name="name" placeholder="Full Name" required className="w-full bg-transparent border-b border-white/10 py-2 text-sm focus:border-red-600 outline-none transition-colors" />
                <input type="tel" name="phone" placeholder="Phone" required className="w-full bg-transparent border-b border-white/10 py-2 text-sm focus:border-red-600 outline-none transition-colors" />
                <input type="text" name="address" placeholder="Shipping Address" required className="w-full bg-transparent border-b border-white/10 py-2 text-sm focus:border-red-600 outline-none transition-colors" />
                <div className="grid grid-cols-2 gap-6 pt-2">
                  <input type="text" name="bkashNumber" placeholder="bKash No." required className="w-full bg-transparent border-b border-white/10 py-2 text-sm focus:border-red-600 outline-none transition-colors" />
                  <input type="text" name="txid" placeholder="Trx ID" required className="w-full bg-transparent border-b border-white/10 py-2 text-sm focus:border-red-600 outline-none transition-colors" />
                </div>
              </div>
              <button type="submit" className="w-full bg-white text-black font-bold py-4 mt-8 uppercase text-[10px] tracking-[0.4em] hover:bg-red-600 hover:text-white transition-all">
                Confirm Order
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export async function getStaticProps() {
  try {
    const productsDir = path.join(process.cwd(), 'public/products');
    const descDir = path.join(process.cwd(), 'descriptions');
    
    let imageFiles = [];
    if (fs.existsSync(productsDir)) {
      imageFiles = fs.readdirSync(productsDir).filter(file => /\.(jpg|jpeg|png|webp)$/i.test(file));
    }

    const products = imageFiles.map((filename) => {
      const handle = path.parse(filename).name;
      const descPath = path.join(descDir, `${handle}.txt`);
      let description = "Premium quality merchandise.";
      
      if (fs.existsSync(descPath)) {
        const content = fs.readFileSync(descPath, 'utf8').trim();
        // ৩য় লাইন থেকে ডেসক্রিপশন নেওয়ার চেষ্টা করবে, না থাকলে পুরোটা দেখাবে
        const lines = content.split('\n');
        description = lines.length >= 3 ? lines.slice(2).join(' ') : content;
      }

      return {
        cleanName: handle.replace(/[-_]/g, ' '),
        image: filename,
        hasImage: true,
        description: description.substring(0, 150),
      };
    });

    return {
      props: { products: JSON.parse(JSON.stringify(products)) },
      revalidate: 10,
    };
  } catch (error) {
    return { props: { products: [] } };
  }
}
