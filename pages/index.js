import { useState } from 'react';
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
    <div className="bg-[#0a0a0a] text-white min-h-screen font-sans antialiased selection:bg-white selection:text-black">
      
      {/* Premium Header */}
      <header className="fixed top-0 w-full z-50 bg-black/40 backdrop-blur-2xl border-b border-white/[0.05] px-8 py-6 flex justify-between items-center">
        <div className="flex flex-col">
          <h1 className="text-3xl font-black tracking-[0.25em] leading-none">NOMAD</h1>
          <span className="text-[11px] italic font-light tracking-widest text-zinc-400 mt-1" style={{ fontFamily: 'serif' }}>
            The one. Everywhere.
          </span>
        </div>
        <span className="text-[10px] tracking-[0.2em] border border-white/20 px-3 py-1 rounded-full uppercase font-medium">
          Official
        </span>
      </header>

      {/* Hero Section */}
      <section className="pt-48 pb-20 text-center max-w-3xl mx-auto px-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <h2 className="text-6xl md:text-8xl font-bold tracking-tighter uppercase mb-6 opacity-90">
          Collections
        </h2>
        <div className="h-[1px] w-20 bg-red-600 mx-auto mb-6"></div>
      </section>

      {/* Grid Section */}
      <main className="max-w-7xl mx-auto px-8 pb-32">
        {products.length === 0 ? (
          <div className="text-center py-32 border border-white/[0.03] bg-zinc-900/20 rounded-[2rem] shadow-2xl">
            <p className="text-zinc-500 text-lg font-light tracking-widest italic">Not available!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {products.map((product, index) => (
              <div key={index} className="group relative flex flex-col transition-all duration-700">
                
                {/* Image Container with Premium Shadow */}
                <div className="aspect-[3/4] bg-zinc-900 overflow-hidden rounded-sm relative shadow-[0_20px_50px_rgba(0,0,0,0.5)] group-hover:shadow-[0_30px_60px_rgba(0,0,0,0.7)] transition-all duration-500">
                  {product.hasImage ? (
                    <img 
                      src={`/products/${product.image}`} 
                      alt={product.cleanName} 
                      className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 group-hover:scale-110 transition-all duration-1000"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-700 uppercase tracking-tighter font-bold">No Image</div>
                  )}
                  
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center">
                    <button 
                      onClick={() => openOrderForm(product.cleanName)}
                      className="bg-white text-black px-8 py-3 text-xs font-bold uppercase tracking-widest hover:bg-red-600 hover:text-white transition-colors"
                    >
                      Quick Buy
                    </button>
                  </div>
                </div>

                {/* Info */}
                <div className="mt-6 space-y-2">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-200">{product.cleanName}</h3>
                  <p className="text-xs text-zinc-500 font-light leading-relaxed line-clamp-2 italic">{product.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Minimalist Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-[#0f0f0f] w-full max-w-md rounded-sm p-8 relative border border-white/10 shadow-2xl animate-in zoom-in-95 duration-300">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-6 text-zinc-500 hover:text-white text-3xl font-light">&times;</button>
            
            <h3 className="text-xl font-bold uppercase tracking-[0.2em] mb-8 text-center">Checkout</h3>

            <form action="/api/order" method="POST" className="space-y-5">
              <input type="hidden" name="product" value={selectedProduct} />
              
              <div className="space-y-4">
                <input type="text" name="name" placeholder="Full Name" required className="w-full bg-transparent border-b border-white/10 py-3 text-sm focus:border-red-600 outline-none transition-colors" />
                <input type="tel" name="phone" placeholder="Contact Number" required className="w-full bg-transparent border-b border-white/10 py-3 text-sm focus:border-red-600 outline-none transition-colors" />
                <input type="text" name="address" placeholder="Shipping Address" required className="w-full bg-transparent border-b border-white/10 py-3 text-sm focus:border-red-600 outline-none transition-colors" />
                
                <div className="grid grid-cols-2 gap-4 pt-4">
                  <input type="text" name="bkashNumber" placeholder="bKash Number" required className="w-full bg-transparent border-b border-white/10 py-3 text-sm focus:border-red-600 outline-none transition-colors" />
                  <input type="text" name="txid" placeholder="TrxID" required className="w-full bg-transparent border-b border-white/10 py-3 text-sm focus:border-red-600 outline-none transition-colors" />
                </div>
              </div>
              
              <button type="submit" className="w-full bg-white text-black font-bold py-4 mt-8 uppercase text-[10px] tracking-[0.3em] hover:bg-red-600 hover:text-white transition-all">
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
  const productsDir = path.join(process.cwd(), 'public/products');
  const descDir = path.join(process.cwd(), 'descriptions');
  
  let imageFiles = [];
  let descFiles = [];

  if (fs.existsSync(productsDir)) {
    imageFiles = fs.readdirSync(productsDir).filter(file => /\.(jpg|jpeg|png|webp|gif)$/i.test(file));
  }
  if (fs.existsSync(descDir)) {
    descFiles = fs.readdirSync(descDir).filter(file => file.endsWith('.txt'));
  }

  const allHandles = Array.from(new Set([
    ...imageFiles.map(f => path.parse(f).name),
    ...descFiles.map(f => path.parse(f).name)
  ]));

  const products = allHandles.map((handle) => {
    const matchedImage = imageFiles.find(f => path.parse(f).name === handle);
    const descPath = path.join(descDir, `${handle}.txt`);
    
    let description = "Premium quality merchandise.";
    if (fs.existsSync(descPath)) {
      description = fs.readFileSync(descPath, 'utf8').trim() || "Premium quality merchandise.";
    }

    return {
      name: handle,
      cleanName: handle.replace(/[-_]/g, ' '),
      image: matchedImage || null,
      hasImage: !!matchedImage,
      description: description,
    };
  });

  return {
    props: { products },
    revalidate: 5, 
  };
}
