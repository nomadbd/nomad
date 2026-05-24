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
    <div className="bg-[#050505] text-zinc-100 min-h-screen font-sans flex flex-col antialiased">
      
      {/* Centered Minimal Header */}
      <header className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-lg border-b border-white/5 py-6 px-6">
        <div className="max-w-7xl mx-auto flex flex-col items-center">
          <h1 className="text-2xl font-black tracking-[0.4em] text-white">NOMAD</h1>
          <p className="text-[9px] uppercase tracking-[0.2em] text-zinc-500 mt-2">The one. Everywhere.</p>
        </div>
      </header>

      {/* Product Display Section */}
      <main className="flex-grow pt-36 pb-20 max-w-7xl mx-auto px-6 w-full">
        {(!products || products.length === 0) ? (
          <div className="flex items-center justify-center py-40">
            <p className="text-zinc-700 text-sm tracking-[0.3em] uppercase italic">Collections Not Available</p>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-20">
            {products.map((product, index) => (
              <div key={index} className="w-full max-w-[450px] flex flex-col animate-in fade-in duration-1000">
                
                {/* Clean Image Card */}
                <div className="relative aspect-[4/5] bg-zinc-900 rounded-2xl overflow-hidden shadow-2xl">
                  {product.hasImage ? (
                    <img 
                      src={`/products/${product.image}`} 
                      alt={product.cleanName} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-800 text-[10px] tracking-widest uppercase">Pending Image</div>
                  )}
                </div>

                {/* Info & Buy Button Below Description */}
                <div className="mt-8 space-y-4 text-center px-2">
                  <h3 className="text-lg font-bold tracking-widest uppercase text-white">{product.cleanName}</h3>
                  <p className="text-xs text-zinc-400 font-light leading-relaxed italic">
                    {product.description}
                  </p>
                  
                  {/* Single Order Button - Placed at the bottom of description */}
                  <div className="pt-6">
                    <button 
                      onClick={() => openOrderForm(product.cleanName)}
                      className="w-full bg-zinc-100 text-black py-4 rounded-full text-[10px] font-black uppercase tracking-[0.3em] hover:bg-red-600 hover:text-white transition-all active:scale-95 duration-300 shadow-lg shadow-white/5"
                    >
                      Order Now
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full py-16 border-t border-white/5 bg-black text-center">
        <p className="text-[10px] tracking-[0.5em] uppercase text-zinc-600 font-medium">Nomad by SH</p>
        <p className="text-[8px] text-zinc-800 mt-4 tracking-widest">&copy; {new Date().getFullYear()} ALL RIGHTS RESERVED.</p>
      </footer>

      {/* Premium Order Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-5">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={() => setIsModalOpen(false)}></div>
          
          <div className="bg-[#0f0f0f] w-full max-w-md p-8 sm:p-12 relative border border-white/10 shadow-2xl rounded-3xl animate-in zoom-in-95 duration-500">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-8 text-zinc-500 hover:text-white text-2xl font-light">&times;</button>
            
            <div className="mb-12">
              <h3 className="text-sm font-black uppercase tracking-[0.4em] text-center text-white">Order Details</h3>
              <div className="h-[1px] w-12 bg-red-600 mx-auto mt-4"></div>
            </div>

            <form action="/api/order" method="POST" className="space-y-8">
              <input type="hidden" name="product" value={selectedProduct} />
              
              <div className="space-y-6">
                <input type="text" name="name" placeholder="FULL NAME" required className="w-full bg-transparent border-b border-white/10 py-3 text-xs tracking-widest focus:border-white outline-none transition-all placeholder:text-zinc-800" />
                <input type="tel" name="phone" placeholder="PHONE NUMBER" required className="w-full bg-transparent border-b border-white/10 py-3 text-xs tracking-widest focus:border-white outline-none transition-all placeholder:text-zinc-800" />
                <input type="text" name="address" placeholder="SHIPPING ADDRESS" required className="w-full bg-transparent border-b border-white/10 py-3 text-xs tracking-widest focus:border-white outline-none transition-all placeholder:text-zinc-800" />
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-4">
                  <input type="text" name="bkashNumber" placeholder="BKASH NO." required className="w-full bg-transparent border-b border-white/10 py-3 text-xs tracking-widest focus:border-white outline-none transition-all placeholder:text-zinc-800" />
                  <input type="text" name="txid" placeholder="TRANSACTION ID" required className="w-full bg-transparent border-b border-white/10 py-3 text-xs tracking-widest focus:border-white outline-none transition-all placeholder:text-zinc-800" />
                </div>
              </div>
              
              <button type="submit" className="w-full bg-white text-black font-black py-5 mt-12 rounded-full uppercase text-[10px] tracking-[0.4em] hover:bg-red-600 hover:text-white transition-all shadow-xl active:scale-95 duration-300">
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
        const lines = content.split('\n');
        // ৩য় লাইন থেকে ডেসক্রিপশন নেওয়ার চেষ্টা করবে
        description = lines.length >= 3 ? lines.slice(2).join(' ') : content;
      }

      return {
        cleanName: handle.replace(/[-_]/g, ' '),
        image: filename,
        hasImage: true,
        description: description,
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
