import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import fs from 'fs';
import path from 'path';

export default function Home({ allProducts, siteContent, announcement }) {
  const router = useRouter();
  const [categories, setCategories] = useState({});
  const [selectedProduct, setSelectedProduct] = useState({ id: '', name: '', price: '', ref: '' });
  const [viewCategory, setViewCategory] = useState(null); // See More এর জন্য
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    // ক্যাটাগরি অনুযায়ী প্রডাক্ট সাজানো এবং Randomly Shuffle করা
    const shuffled = [...allProducts].sort(() => Math.random() - 0.5);
    const catMap = {};
    shuffled.forEach(p => {
      const catName = p.name.split(' ')[0]; // নামের প্রথম শব্দ ক্যাটাগরি
      if (!catMap[catName]) catMap[catName] = [];
      catMap[catName].push(p);
    });
    setCategories(catMap);

    // URL থেকে Product ID এবং FB Ref সংগ্রহ
    if (router.query.product) {
      const target = allProducts.find(p => p.id === router.query.product);
      if (target) {
        setSelectedProduct({ 
          id: target.id, 
          name: target.name, 
          price: target.price,
          ref: router.query.ref || '' 
        });
        setIsModalOpen(true);
      }
    }
  }, [allProducts, router.query]);

  return (
    <div style={{ backgroundColor: '#000', color: '#fff', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
      <Head><title>NOMAD | Premium Store</title></Head>

      <style>{`
        .scroll-container { display: flex; overflow-x: auto; gap: 15px; padding: 10px 20px; scroll-snap-type: x mandatory; scrollbar-width: none; }
        .scroll-container::-webkit-scrollbar { display: none; }
        .product-item { min-width: 280px; scroll-snap-align: start; background: #0a0a0a; border-radius: 20px; padding: 10px; }
        .cat-title { font-size: 14px; letter-spacing: 4px; margin: 40px 20px 10px; text-transform: uppercase; color: #fff; display: flex; justify-content: space-between; align-items: center; }
        .see-more { font-size: 10px; color: #777; cursor: pointer; border-bottom: 1px solid #333; }
        .grid-view { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; padding: 20px; }
        .desc-line { display: grid; grid-template-columns: 80px 10px 1fr; font-size: 11px; color: #777; margin-bottom: 4px; }
      `}</style>

      {/* Header & Search */}
      <header style={{ textAlign: 'center', padding: '30px', borderBottom: '1px solid #111' }}>
        <h1 style={{ letterSpacing: '15px', fontWeight: '900' }}>NOMAD</h1>
      </header>

      {viewCategory ? (
        // See More ক্লিক করলে গ্রিড ভিউ
        <div>
          <div className="cat-title">
            <span>{viewCategory} Collection</span>
            <span className="see-more" onClick={() => setViewCategory(null)}>BACK</span>
          </div>
          <div className="grid-view">
            {categories[viewCategory].map((p, i) => (
              <div key={i} onClick={() => { setSelectedProduct({...p, ref: ''}); setIsModalOpen(true); }} style={{ cursor: 'pointer' }}>
                <img src={`/products/${p.image}`} style={{ width: '100%', borderRadius: '15px' }} />
                <p style={{ fontSize: '10px', textAlign: 'center', marginTop: '10px' }}>{p.name}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        // হোম পেজে ক্যাটাগরি অনুযায়ী হরিজন্টাল স্ক্রল
        Object.keys(categories).map(cat => (
          <section key={cat}>
            <div className="cat-title">
              <span>{cat}</span>
              <span className="see-more" onClick={() => setViewCategory(cat)}>SEE MORE</span>
            </div>
            <div className="scroll-container">
              {categories[cat].map((p, i) => (
                <div key={i} className="product-item">
                  <img src={`/products/${p.image}`} style={{ width: '100%', borderRadius: '15px' }} />
                  <div style={{ padding: '15px 5px' }}>
                    <h4 style={{ fontSize: '13px', margin: '0 0 10px 0' }}>{p.name}</h4>
                    <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#fff' }}>{p.price} BDT</p>
                    <button 
                      onClick={() => { setSelectedProduct({...p, ref: ''}); setIsModalOpen(true); }}
                      style={{ width: '100%', padding: '12px', marginTop: '15px', background: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '10px' }}
                    >ORDER NOW</button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))
      )}

      {/* Order Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#0a0a0a', width: '100%', maxWidth: '400px', padding: '30px', borderRadius: '30px', border: '1px solid #222', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontSize: '14px', textAlign: 'center', letterSpacing: '2px' }}>{selectedProduct.name}</h2>
            <p style={{ textAlign: 'center', color: '#777', fontSize: '12px' }}>Price: {selectedProduct.price} BDT</p>
            
            <form action="/api/order" method="POST" style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
              <input type="hidden" name="product_name" value={selectedProduct.name} />
              <input type="hidden" name="product_price" value={selectedProduct.price} />
              <input type="hidden" name="fb_ref" value={selectedProduct.ref} />

              <input type="text" name="name" placeholder="YOUR NAME" required />
              <input type="tel" name="phone" placeholder="PHONE NUMBER" required />
              <textarea name="address" placeholder="FULL ADDRESS" required style={{ minHeight: '80px' }}></textarea>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <input type="text" name="size" placeholder="SIZE (M/L/XL)" required />
                <input type="text" name="color" placeholder="COLOR" required />
              </div>

              <div style={{ background: '#050505', padding: '15px', borderRadius: '15px' }}>
                <p style={{ fontSize: '10px', color: '#555', marginBottom: '10px' }}>PAYMENT (BKASH/NAGAD: 01521731371)</p>
                <input type="text" name="txn_id" placeholder="TRANSACTION ID" required />
              </div>

              <button type="submit" style={{ background: '#fff', color: '#000', padding: '18px', borderRadius: '15px', fontWeight: 'bold' }}>CONFIRM ORDER</button>
              <button type="button" onClick={() => setIsModalOpen(false)} style={{ color: '#555', background: 'none', border: 'none', marginTop: '10px' }}>CANCEL</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export async function getStaticProps() {
  const pDir = path.join(process.cwd(), 'public/products');
  const dDir = path.join(process.cwd(), 'descriptions');
  const images = fs.readdirSync(pDir).filter(f => /\.(jpg|jpeg|png)$/i.test(f));
  
  const allProducts = images.map(img => {
    const id = path.parse(img).name;
    const dPath = path.join(dDir, `${id}.txt`);
    let name = id, price = "0", desc = "";
    if (fs.existsSync(dPath)) {
      const lines = fs.readFileSync(dPath, 'utf8').split('\n');
      name = lines[0];
      price = lines.find(l => l.includes('Price'))?.split(':')[1]?.trim() || "1200";
      desc = lines.slice(1).join('\n');
    }
    return { id, name, price, image: img, desc };
  });

  return { props: { allProducts, siteContent: {}, announcement: "" }, revalidate: 10 };
}
