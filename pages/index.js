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
    <div className="bg-[#050505] text-white min-h-screen font-sans antialiased selection:bg-red-600 selection:text-white">
      
      {/* Premium Glassmorphic Header */}
      <header className="fixed top-0 w-full z-50 bg-black/30 backdrop-blur-xl border-b border-white/[0.06] px-6 py-5 flex justify-between items-center">
        <h1 className="text-2xl font-black tracking-[0.2em] text-red-500">NOMAD</h1>
        <span className="text-[10px] tracking-widest bg-red-500/10 text-red-400 px-3 py-1 rounded-full border border-red-500/20 font-bold uppercase">The one.Everywhere.</span>
      </header>

      {/* Hero Section */}
      <section className="pt-40 pb-16 text-center max-w-2xl mx-auto px-4">
        <p className="text-xs uppercase tracking-[0.3em] text-zinc-500 font-bold mb-3">Nomad Merchandise</p>
        <h2 className="text-5xl md:text-7xl font-black tracking-tighter uppercase bg-gradient-to-b from-white to-zinc-400 bg-clip-text text-transparent">
          The Tribe Store
        </h2>
        <p className="text-zinc-400 mt-4 text-sm md:text-base font-light max-w-md mx-auto leading-relaxed">
          নিচের মার্চেন্ডাইজ থেকে আপনার পছন্দের পণ্যটি বেছে নিন। সরাসরি বিকাশ পার্সোনালের মাধ্যমে অর্ডার করুন।
        </p>
      </section>

      {/* Grid Section */}
      <main className="max-w-7xl mx-auto px-6 pb-24">
        {products.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-zinc-800 rounded-3xl">
            <p className="text-zinc-500 text-sm">কোনো পণ্য পাওয়া যায়নি। `public/products/` ফোল্ডারে ছবি আপলোড করুন।</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product, index) => (
              <div key={index} className="bg-zinc-950/40 border border-white/[0.04] rounded-2xl overflow-hidden group hover:border-red-500/30 transition-all duration-500 flex flex-col justify-between">
                
                {/* Image Handle */}
                <div className="h-80 bg-zinc-900/50 relative overflow-hidden flex items-center justify-center border-b border-white/[0.02]">
                  {product.hasImage ? (
                    <img 
                      src={`/products/${product.image}`} 
                      alt={product.cleanName} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  {/* Image Missing Placeholder */}
                  <div className={`absolute inset-0 flex flex-col items-center justify-center bg-zinc-900 text-zinc-600 text-xs ${product.hasImage ? 'hidden' : 'flex'}`}>
                    <span className="text-xl mb-1">📸</span> Image Coming Soon
                  </div>
                </div>

                {/* Content Box */}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="text-xl font-bold tracking-tight capitalize text-zinc-100 group-hover:text-red-400 transition-colors">
                      {product.cleanName}
                    </h3>
                    <p className="text-sm text-zinc-400 mt-2 whitespace-pre-line leading-relaxed font-light">
                      {product.description}
                    </p>
                  </div>
                  <button 
                    onClick={() => openOrderForm(product.cleanName)} 
                    className="w-full text-center bg-zinc-900 hover:bg-red-600 border border-zinc-800 hover:border-red-600 text-white font-medium py-3 rounded-xl transition-all duration-300 tracking-wide text-sm"
                  >
                    Buy Now
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}
      </main>

      {/* Order Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#0b0b0b] border border-white/[0.08] w-full max-w-lg rounded-3xl p-6 md:p-8 space-y-6 relative max-h-[90vh] overflow-y-auto shadow-2xl shadow-black">
            
            <button onClick={() => setIsModalOpen(false)} className="absolute top-5 right-5 text-zinc-500 hover:text-white text-2xl transition">&times;</button>
            
            <div className="text-center space-y-1">
              <h3 className="text-2xl font-black tracking-tight text-red-500">অর্ডার কনফার্ম করুন</h3>
              <p className="text-xs text-zinc-400">বিকাশ পার্সোনাল নাম্বারে টাকা <span class="text-white font-bold">Send Money</span> করে ফর্মটি পূরণ করুন।</p>
            </div>

            <form action="/api/order" method="POST" className="space-y-4 text-zinc-200">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">Selected Product</label>
                <input type="text" name="product" value={selectedProduct} readOnly className="w-full bg-zinc-900/50 text-red-400 border border-zinc-800 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none" />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input type="text" name="name" placeholder="আপনার নাম" required className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-700" />
                <input type="tel" name="phone" placeholder="মোবাইল নাম্বার" required className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-700" />
              </div>
              
              <textarea name="address" rows="2" placeholder="পূর্ণাঙ্গ ডেলিভারি ঠিকানা" required className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-700"></textarea>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-zinc-950 p-4 rounded-xl border border-zinc-900">
                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-wider text-zinc-500 mb-1">আপনার বিকাশ নম্বর</label>
                  <input type="text" name="bkashNumber" placeholder="01XXXXXXXXX" required className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-700" />
                </div>
                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Transaction ID (TxID)</label>
                  <input type="text" name="txid" placeholder="Trx ID" required className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-700" />
                </div>
              </div>
              
              <button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-xl transition duration-300 text-sm tracking-wide shadow-lg shadow-red-600/10">
                অর্ডার সাবমিট করুন
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Next.js Automated File-Scanning Backend
export async function getStaticProps() {
  const productsDir = path.join(process.cwd(), 'public/products');
  const descDir = path.join(process.cwd(), 'descriptions');
  
  let imageFiles = [];
  let descFiles = [];

  // Read Products Folder Safely
  if (fs.existsSync(productsDir)) {
    imageFiles = fs.readdirSync(productsDir).filter(file => /\.(jpg|jpeg|png|webp|gif)$/i.test(file));
  }
  // Read Descriptions Folder Safely
  if (fs.existsSync(descDir)) {
    descFiles = fs.readdirSync(descDir).filter(file => file.endsWith('.txt'));
  }

  // Combine unique product handles from both folders to avoid duplicates or crashes
  const allHandles = Array.from(new Set([
    ...imageFiles.map(f => path.parse(f).name),
    ...descFiles.map(f => path.parse(f).name)
  ]));

  const products = allHandles.map((handle) => {
    const matchedImage = imageFiles.find(f => path.parse(f).name === handle);
    const descPath = path.join(descDir, `${handle}.txt`);
    
    let description = "Description coming soon...";
    if (fs.existsSync(descPath)) {
      description = fs.readFileSync(descPath, 'utf8').trim() || "Description coming soon...";
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
