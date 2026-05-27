import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import fs from 'fs';
import path from 'path';

export default function Home({ allProducts, siteContent, announcement }) {
  const router = useRouter();
  const [categories, setCategories] = useState({});
  const [selectedProduct, setSelectedProduct] = useState({ id: '', name: '', price: 0, ref: '' });
  const [viewCategory, setViewCategory] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // অ্যানাউন্সমেন্ট থেকে শুধু % চিহ্নের আগের সংখ্যাটি ডিসকাউন্ট হিসেবে নেওয়ার লজিক
  const discountRegex = /(\d+)%/;
  const discountMatch = announcement.match(discountRegex);
  const discountPercent = discountMatch ? parseInt(discountMatch[1]) : 0;

  useEffect(() => {
    // প্রডাক্টগুলো র‍্যান্ডমলি সাজানো এবং ক্যাটাগরাইজ করা
    const shuffled = [...allProducts].sort(() => Math.random() - 0.5);
    const catMap = {};
    shuffled.forEach(p => {
      const catName = p.name.split(' ')[0]; // নামের প্রথম শব্দ ক্যাটাগরি
      if (!catMap[catName]) catMap[catName] = [];
      catMap[catName].push(p);
    });
    setCategories(catMap);

    // URL থেকে Product ID এবং FB Ref সংগ্রহ (?product=ID&ref=PostCode)
    if (router.query.product) {
      const target = allProducts.find(p => p.id === router.query.product);
      if (target) {
        setSelectedProduct({ ...target, ref: router.query.ref || '' });
        setIsModalOpen(true);
      }
    }
  }, [allProducts, router.query]);

  const calculatePrice = (price) => {
    const p = parseFloat(price);
    return discountPercent > 0 ? Math.floor(p - (p * discountPercent / 100)) : p;
  };

  return (
    <div style={{ backgroundColor: '#000', color: '#fff', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
      <Head><title>NOMAD | Premium Store</title></Head>

      <style>{`
        .scroll-container { display: flex; overflow-x: auto; gap: 20px; padding: 10px 20px; scrollbar-width: none; -ms-overflow-style: none; }
        .scroll-container::-webkit-scrollbar { display: none; }
        .product-item { min-width: 260px; background: #0a0a0a; border-radius: 25px; padding: 12px; border: 1px solid #111; transition: transform 0.3s; }
        .cat-title { font-size: 13px; letter-spacing: 4px; margin: 45px 20px 15px; text-transform: uppercase; display: flex; justify-content: space-between; align-items: center; }
        .see-more { font-size: 10px; color: #555; cursor: pointer; border-bottom: 1px solid #222; letter-spacing: 1px; }
        .grid-view { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; padding: 20px; padding-bottom: 100px; }
      `}</style>

      {/* Header */}
      <header style={{ textAlign: 'center', padding: '40px 20px', borderBottom: '1px solid #111' }}>
        <h1 style={{ letterSpacing: '15px', fontWeight: '900', margin: 0, fontSize: '28px' }}>NOMAD</h1>
        {announcement && (
          <div style={{ background: '#fff', color: '#000', fontSize: '10px', padding: '6px 18px', borderRadius: '50px', display: 'inline-block', marginTop: '20px', fontWeight: 'bold', letterSpacing: '1px' }}>
            {announcement}
          </div>
        )}
      </header>

      {viewCategory ? (
        // See More ক্লিক করলে ভিউ
        <div>
          <div className="cat-title"><span>{viewCategory} Collection</span><span onClick={() => setViewCategory(null)} className="see-more">BACK TO HOME</span></div>
          <div className="grid-view">
            {categories[viewCategory].map((p, i) => (
              <div key={i} onClick={() => { setSelectedProduct({...p, ref: ''}); setIsModalOpen(true); }} style={{ cursor: 'pointer', background: '#0a0a0a', padding: '10px', borderRadius: '20px' }}>
                <img src={`/products/${p.image}`} style={{ width: '100%', borderRadius: '15px' }} />
                <p style={{ fontSize: '11px', margin: '12px 0 5px', letterSpacing: '1px' }}>{p.name}</p>
                <p style={{ fontSize: '13px', fontWeight: 'bold' }}>৳{calculatePrice(p.price)}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        // ক্যাটাগরি স্ক্রল ভিউ
        Object.keys(categories).map(cat => (
          <section key={cat}>
            <div className="cat-title"><span>{cat}</span><span onClick={() => setViewCategory(cat)} className="see-more">SEE ALL</span></div>
            <div className="scroll-container">
              {categories[cat].map((p, i) => (
                <div key={i} className="product-item">
                  <img src={`/products/${p.image}`} style={{ width: '100%', borderRadius: '18px' }} />
                  <div style={{ padding: '15px 5px' }}>
                    <h4 style={{ fontSize: '14px', margin: '0 0 8px 0', letterSpacing: '1px' }}>{p.name}</h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '16px', fontWeight: 'bold' }}>৳{calculatePrice(p.price)}</span>
                      {discountPercent > 0 && <span style={{ textDecoration: 'line-through', color: '#444', fontSize: '11px' }}>৳{p.price}</span>}
                    </div>
                    <button onClick={() => { setSelectedProduct({...p, ref: ''}); setIsModalOpen(true); }} style={{ width: '100%', padding: '15px', marginTop: '18px', background: '#fff', color: '#000', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '10px', letterSpacing: '2px' }}>ORDER NOW</button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))
      )}

      {/* Order Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.98)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#0a0a0a', width: '100%', maxWidth: '400px', padding: '35px', borderRadius: '35px', border: '1px solid #1a1a1a', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontSize: '16px', textAlign: 'center', letterSpacing: '3px' }}>{selectedProduct.name}</h2>
            
            <div style={{ textAlign: 'center', margin: '20px 0', padding: '20px', background: '#050505', borderRadius: '20px', border: '1px solid #111' }}>
              <p style={{ color: '#555', fontSize: '10px', margin: 0, letterSpacing: '2px' }}>PAYABLE AMOUNT</p>
              <h3 style={{ fontSize: '28px', margin: '8px 0' }}>৳{calculatePrice(selectedProduct.price)}</h3>
              {discountPercent > 0 && <p style={{ fontSize: '11px', color: '#00ff00', margin: 0 }}>{discountPercent}% DISCOUNT APPLIED</p>}
            </div>

            <form action="/api/order" method="POST" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <input type="hidden" name="product_name" value={selectedProduct.name} />
              <input type="hidden" name="final_price" value={calculatePrice(selectedProduct.price)} />
              <input type="hidden" name="fb_ref" value={selectedProduct.ref} />

              <input type="text" name="name" placeholder="FULL NAME" required style={{ background: 'none', borderBottom: '1px solid #222', padding: '12px', color: '#fff' }} />
              <input type="tel" name="phone" placeholder="PHONE NUMBER" required style={{ background: 'none', borderBottom: '1px solid #222', padding: '12px', color: '#fff' }} />
              <textarea name="address" placeholder="SHIPPING ADDRESS" required style={{ background: 'none', borderBottom: '1px solid #222', padding: '12px', color: '#fff', minHeight: '70px' }}></textarea>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <input type="text" name="size" placeholder="SIZE" required style={{ background: 'none', borderBottom: '1px solid #222', padding: '12px', color: '#fff' }} />
                <input type="text" name="color" placeholder="COLOR" required style={{ background: 'none', borderBottom: '1px solid #222', padding: '12px', color: '#fff' }} />
              </div>

              <input type="text" name="txn_id" placeholder="TRANSACTION ID" required style={{ background: 'none', borderBottom: '1px solid #222', padding: '12px', color: '#fff' }} />
              
              <button type="submit" style={{ background: '#fff', color: '#000', padding: '20px', borderRadius: '15px', fontWeight: 'bold', letterSpacing: '3px', marginTop: '10px' }}>CONFIRM ORDER</button>
              <button type="button" onClick={() => setIsModalOpen(false)} style={{ color: '#444', background: 'none', border: 'none', fontSize: '11px', cursor: 'pointer' }}>CANCEL</button>
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
  const cDir = path.join(process.cwd(), 'content');

  const images = fs.readdirSync(pDir).filter(f => /\.(jpg|jpeg|png)$/i.test(f));
  const allProducts = images.map(img => {
    const id = path.parse(img).name;
    const dPath = path.join(dDir, `${id}.txt`);
    let name = id, price = "1200";
    if (fs.existsSync(dPath)) {
      const lines = fs.readFileSync(dPath, 'utf8').split('\n');
      name = lines[0];
      const pLine = lines.find(l => l.toLowerCase().includes('price'));
      price = pLine ? pLine.split(':')[1].trim() : "1200";
    }
    return { id, name, price, image: img };
  });

  const announcePath = path.join(cDir, 'announcement.txt');
  const announcement = fs.existsSync(announcePath) ? fs.readFileSync(announcePath, 'utf8') : "";

  return { props: { allProducts, announcement }, revalidate: 10 };
}
