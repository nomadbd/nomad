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
    <div className="bg-[#080808] text-white min-h-screen font-sans flex flex-col selection:bg-red-600">
      
      {/* Header - More Minimal & Centered on Mobile */}
      <header className="fixed top-0 w-full z-50 bg-black/60 backdrop-blur-2xl border-b border-white/[0.05] py-5 px-6">
        <div className="max-w-7xl mx-auto flex flex-col items-center">
          <h1 className="text-2xl font-black tracking-[0.3em] leading-tight">NOMAD</h1>
          <p className="text-[10px] italic text-zinc-500 tracking-widest mt-1">The one. Everywhere.</p>
        </div>
      </header>

      {/* Hero / Collection Title */}
      <main className="flex-grow pt-32 pb-20 max-w-7xl mx-auto px-5 w-full">
        {(!products || products.length === 0) ? (
          <div className="flex items-center justify-center py-40">
            <p className="text-zinc-600 text-sm tracking-[0.3em] uppercase italic animate-pulse">Collections not available!</p>
          </div>
        ) : (
          <div className="space-y-12">
            <div className="text-center space-y-2">
               <h2 className="text-xs uppercase tracking-[0.5em] text-red-600 font-bold">New Arrival</h2>
               <div className="h-[1px] w-12 bg-zinc-800 mx-auto mt-4"></div>
            </div>

            {/* Product Grid with Animation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
              {products.map((product, index) => (
                <div 
                  key={index} 
                  className="group flex flex-col animate-in fade-in slide-in-from-bottom-8 duration-1000 ease-out"
                  style={{ animationDelay: `${index * 200}ms` }}
                >
                  {/* Image Card */}
                  <div className="relative aspect-[4/5] bg-zinc-900 overflow-hidden rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.3)] group-hover:shadow-red-900/10 transition-all duration-700">
                    {product.hasImage ? (
                      <img 
                        src={`/products/${product.image}`} 
                        alt={product.cleanName} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[1.5s] ease-in-out"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-800 text-[10px] tracking-widest uppercase">Image Pending</div>
                    )}
                    
                    {/* Hover Button for Desktop / Permanent on Mobile for better UX */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end justify-center pb-8">
                      <button 
                        onClick={() => openOrderForm(product.cleanName)}
                        className="bg-white text-black px-10 py-3 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-red-600 hover:text-white transition-all transform translate-y-4 group-hover:translate-y-0 duration-500"
                      >
                        Order Now
                      </button>
                    </div>
                  </div>

                  {/* Info Section */}
                  <div className="mt-6 space-y-2 px-1 text-center">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-100">{product.cleanName}</h3>
                    <p className="text-[11px] text-zinc-500 font-light leading-relaxed max-w-[280px] mx-auto italic">{product.description}</p>
                    
                    {/* Mobile Only Buy Button */}
                    <button 
                      onClick={() => openOrderForm(product.cleanName)}
                      className="mt-4 sm:hidden w-full border border-white/10 py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-all"
                    >
                      Quick Buy
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full py-16 border-t border-white/[0.03] bg-zinc-950 text-center">
        <p className="text-[9px] tracking-[0.5em] uppercase text-zinc-600">Nomad by SH</p>
        <p className="text-[8px] text-zinc-700 mt-3">&copy; {new Date().getFullYear()} ALL RIGHTS RESERVED.</p>
      </footer>

      {/* Modern Improved Order Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-md" onClick={() => setIsModalOpen(false)}></div>
          
          <div className="bg-[#0f0f0f] w-full max-w-md p-8 sm:p-10 relative border border-white/10 shadow-2xl animate-in zoom-in-95 duration-500 rounded-sm">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-6 text-zinc-500 hover:text-white text-3xl font-light outline-none">&times;</button>
            
            <div className="mb-10 text-center">
              <h3 className="text-lg font-black uppercase tracking-[0.3em] text-white">Order Details</h3>
              <div className="h-[2px] w-8 bg-red-600 mx-auto mt-2"></div>
            </div>

            <form action="/api/order" method="POST" className="space-y-6">
              <input type="hidden" name="product" value={selectedProduct} />
              
              <div className="space-y-5">
                <div className="group">
                  <input type="text" name="name" placeholder="Full Name" required className="w-full bg-transparent border-b border-white/10 py-2 text-sm focus:border-white outline-none transition-all placeholder:text-zinc-700" />
                </div>
                <div className="group">
                  <input type="tel" name="phone" placeholder="Phone Number" required className="w-full bg-transparent border-b border-white/10 py-2 text-sm focus:border-white outline-none transition-all placeholder:text-zinc-700" />
                </div>
                <div className="group">
                  <input type="text" name="address" placeholder="Delivery Address" required className="w-full bg-transparent border-b border-white/10 py-2 text-sm focus:border-white outline-none transition-all placeholder:text-zinc-700" />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                  <input type="text" name="bkashNumber" placeholder="bKash No." required className="w-full bg-transparent border-b border-white/10 py-2 text-sm focus:border-white outline-none transition-all placeholder:text-zinc-700" />
                  <input type="text" name="txid" placeholder="Transaction ID" required className="w-full bg-transparent border-b border-white/10 py-2 text-sm focus:border-white outline-none transition-all placeholder:text-zinc-700" />
                </div>
              </div>
              
              <button type="submit" className="w-full bg-white text-black font-black py-4 mt-8 uppercase text-[10px] tracking-[0.4em] hover:bg-red-600 hover:text-white transition-all shadow-xl">
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
