import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import fs from 'fs';
import path from 'path';

export default function Home({ allProducts, siteContent, announcement }) {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [modalType, setModalType] = useState(null); // 'details' or 'order'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [viewCategory, setViewCategory] = useState(null);

  const paymentNumbers = {
    'Bkash': '01521731371', 'Nagad': '01521731371', 'Rocket': '01521731371', 'Upay': '01521731371', 'Cellfin': '01521731371'
  };

  // ডিসকাউন্ট পারসেন্ট বের করা (যেমন: ১০% থাকলে ১০ নিবে)
  const discountRegex = /(\d+)%/;
  const discountMatch = announcement.match(discountRegex);
  const discountPercent = discountMatch ? parseInt(discountMatch[1]) : 0;

  useEffect(() => {
    const shuffled = [...allProducts].sort(() => Math.random() - 0.5);
    setProducts(shuffled);
    
    // ক্যাটাগরি ম্যাপিং
    const catMap = {};
    shuffled.forEach(p => {
      const catName = p.name.split(' ')[0];
      if (!catMap[catName]) catMap[catName] = [];
      catMap[catName].push(p);
    });
    setCategories(catMap);

    if (router.query.product) {
      const target = allProducts.find(p => p.id === router.query.product);
      if (target) {
        setSelectedProduct({ ...target, ref: router.query.ref || '' });
        setModalType('details');
        setIsModalOpen(true);
      }
    }
  }, [allProducts, router.query]);

  // প্রাইস ক্যালকুলেশন লজিক
  const calculatePrice = (priceText) => {
    const numberOnly = priceText.replace(/[^0-9]/g, "");
    if (!numberOnly || discountPercent === 0) return priceText;
    const discounted = Math.floor(parseInt(numberOnly) - (parseInt(numberOnly) * discountPercent / 100));
    return priceText.replace(numberOnly, discounted);
  };

  // উন্নত সার্চ লজিক (t shirt / T-Shirt সব এক ধরবে)
  const filteredProducts = searchQuery.trim() === '' 
    ? products 
    : products.filter(p => p.name.toLowerCase().replace(/-/g, ' ').includes(searchQuery.toLowerCase().replace(/-/g, ' ')));

  return (
    <div style={{ backgroundColor: '#000', color: '#fff', minHeight: '100vh', fontFamily: 'Inter, sans-serif', margin: 0, overflowX: 'hidden' }}>
      
      <Head>
        <title>NOMAD | Premium Clothing Brand</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>

      <style>{`
        @keyframes luxuryFade { 0% { opacity: 0; transform: translateY(20px); } 100% { opacity: 1; transform: translateY(0); } }
        .product-card { animation: luxuryFade 1.2s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
        .scroll-container { display: flex; overflow-x: auto; gap: 20px; padding: 10px 20px; scrollbar-width: none; width: 100%; box-sizing: border-box; }
        .scroll-container::-webkit-scrollbar { display: none; }
        .cat-item { min-width: 300px; background: #0a0a0a; border-radius: 30px; border: 1px solid #111; overflow: hidden; }
        input, select, textarea { background: none; border: none; border-bottom: 1px solid #222; color: #fff; padding: 12px; outline: none; font-size: 13px; width: 100%; box-sizing: border-box; }
        input:focus, select:focus, textarea:focus { border-bottom-color: #fff; }
        .search-input::placeholder { color: #444; letter-spacing: 2px; text-transform: uppercase; font-size: 10px; }
        .desc-line { display: grid; grid-template-columns: 85px 15px 1fr; font-size: 12px; color: #777; text-align: left; }
        .btn-flex { display: flex; gap: 10px; padding: 0 20px 20px 20px; }
        .btn-details { flex: 1; background: #111; color: #fff; border: 1px solid #222; padding: 15px; border-radius: 12px; font-weight: bold; font-size: 10px; letter-spacing: 1px; cursor: pointer; }
        .btn-order { flex: 1; background: #fff; color: #000; border: none; padding: 15px; border-radius: 12px; font-weight: bold; font-size: 10px; letter-spacing: 1px; cursor: pointer; }
      `}</style>

      <header style={{ textAlign: 'center', padding: '25px 20px', position: 'sticky', top: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(15px)', zIndex: 100, borderBottom: '1px solid #111' }}>
        <h1 style={{ letterSpacing: '15px', fontSize: '24px', margin: 0, fontWeight: '900' }}>NOMAD</h1>
        <p style={{ fontSize: '7px', color: '#555', marginTop: '5px', letterSpacing: '5px', textTransform: 'uppercase' }}>{siteContent.header}</p>
      </header>

      {/* Announcement Card & Search */}
      <div style={{ maxWidth: '410px', margin: '20px auto 10px auto', padding: '0 20px' }}>
        <div style={{ 
          backgroundColor: '#0a0a0a', 
          border: isFocused ? '1.5px solid #fff' : '1px solid #1a1a1a', 
          padding: '20px', borderRadius: '25px', textAlign: 'center'
        }}>
          {announcement && !searchQuery && (
            <p style={{ fontSize: '11px', letterSpacing: '2px', color: '#fff', margin: '0 0 15px 0', textTransform: 'uppercase', fontWeight: 'bold' }}>
              {announcement}
            </p>
          )}
          <input 
            type="text" className="search-input" placeholder="SEARCH PRODUCT" 
            onFocus={() => setIsFocused(true)} onBlur={() => setIsFocused(false)} 
            onChange={(e) => setSearchQuery(e.target.value)} 
            style={{ textAlign: 'center', border: 'none', background: 'none', fontSize: '11px', letterSpacing: '3px', color: '#fff', width: '100%', outline: 'none' }} 
          />
        </div>
      </div>

      <main style={{ maxWidth: '450px', margin: '0 auto' }}>
        {searchQuery ? (
          /* সার্চ রেজাল্ট গ্রিড */
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', padding: '20px' }}>
            {filteredProducts.map((p, i) => (
              <div key={i} className="product-card" onClick={() => { setSelectedProduct(p); setModalType('details'); setIsModalOpen(true); }} style={{ background: '#0a0a0a', padding: '10px', borderRadius: '20px' }}>
                <img src={`/products/${p.image}`} style={{ width: '100%', borderRadius: '15px' }} />
                <p style={{ fontSize: '10px', textAlign: 'center', marginTop: '10px' }}>{p.name}</p>
              </div>
            ))}
          </div>
        ) : viewCategory ? (
          /* See More (সিঙ্গেল কলাম ভিউ) */
          <div style={{ padding: '0 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', margin: '20px 0' }}>
              <span style={{ fontSize: '12px', letterSpacing: '3px' }}>{viewCategory} COLLECTION</span>
              <span onClick={() => setViewCategory(null)} style={{ fontSize: '10px', borderBottom: '1px solid #333' }}>BACK</span>
            </div>
            {categories[viewCategory].map((product, index) => (
              <div key={index} className="product-card" style={{ marginBottom: '60px' }}>
                <img src={`/products/${product.image}`} style={{ width: '100%', borderRadius: '30px' }} />
                <div style={{ textAlign: 'center', marginTop: '20px' }}>
                  <h3 style={{ fontSize: '18px', letterSpacing: '2px' }}>{product.name}</h3>
                  <p style={{ fontWeight: 'bold', margin: '10px 0' }}>{calculatePrice(product.priceText)}</p>
                  <div className="btn-flex">
                    <button className="btn-details" onClick={() => { setSelectedProduct(product); setModalType('details'); setIsModalOpen(true); }}>DETAILS</button>
                    <button className="btn-order" onClick={() => { setSelectedProduct(product); setModalType('order'); setIsModalOpen(true); }}>ORDER NOW</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* হোম পেজ (হরিজন্টাল ক্যাটাগরি) */
          Object.keys(categories).map(cat => (
            <section key={cat} className="product-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '20px 25px' }}>
                <span style={{ fontSize: '12px', letterSpacing: '4px', color: '#666' }}>{cat}</span>
                <span onClick={() => setViewCategory(cat)} style={{ fontSize: '9px', borderBottom: '1px solid #222' }}>SEE MORE</span>
              </div>
              <div className="scroll-container">
                {categories[cat].map((p, i) => (
                  <div key={i} className="cat-item">
                    <img src={`/products/${p.image}`} style={{ width: '100%' }} />
                    <div style={{ padding: '20px', textAlign: 'center' }}>
                      <p style={{ fontSize: '14px', margin: '0' }}>{p.name}</p>
                      <p style={{ fontSize: '12px', margin: '10px 0', fontWeight: 'bold' }}>{calculatePrice(p.priceText)}</p>
                      <div className="btn-flex">
                        <button className="btn-details" onClick={() => { setSelectedProduct(p); setModalType('details'); setIsModalOpen(true); }}>DETAILS</button>
                        <button className="btn-order" onClick={() => { setSelectedProduct(p); setModalType('order'); setIsModalOpen(true); }}>ORDER</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))
        )}
      </main>

      {/* Footer */}
      <footer style={{ textAlign: 'center', padding: '80px 20px', background: '#050505', borderTop: '1px solid #111' }}>
        <p style={{ maxWidth: '300px', margin: '0 auto 40px auto', fontSize: '11px', color: '#555', lineHeight: '2' }}>{siteContent.about}</p>
        <p style={{ letterSpacing: '6px', fontSize: '8px', color: '#222' }}>{siteContent.footer}</p>
      </footer>

      {/* Modal - DETAILS বা ORDER আলাদা ভিউ */}
      {isModalOpen && selectedProduct && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.98)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ backgroundColor: '#0a0a0a', width: '100%', maxWidth: '400px', padding: '40px 25px', borderRadius: '35px', border: '1px solid #1a1a1a', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>
            <button onClick={() => setIsModalOpen(false)} style={{ position: 'absolute', top: '20px', right: '30px', background: 'none', border: 'none', color: '#fff', fontSize: '24px' }}>&times;</button>
            
            {modalType === 'details' ? (
              <div style={{ animation: 'luxuryFade 0.5s ease' }}>
                <img src={`/products/${selectedProduct.image}`} style={{ width: '100%', borderRadius: '20px' }} />
                <h2 style={{ fontSize: '18px', textAlign: 'center', margin: '20px 0' }}>{selectedProduct.name}</h2>
                <div style={{ marginBottom: '20px' }}>
                  {selectedProduct.desc.split('\n').map((line, i) => (
                    line.includes(':') ? (
                      <div key={i} className="desc-line"><span>{line.split(':')[0]}</span><span>:</span><span>{line.split(':')[1]}</span></div>
                    ) : <p key={i} style={{ fontSize: '12px', color: '#777', textAlign: 'center' }}>{line}</p>
                  ))}
                </div>
                <p style={{ textAlign: 'center', fontSize: '20px', fontWeight: 'bold' }}>{calculatePrice(selectedProduct.priceText)}</p>
                <button className="btn-order" style={{ width: '100%', padding: '18px', marginTop: '20px' }} onClick={() => setModalType('order')}>BUY NOW</button>
              </div>
            ) : (
              <form action="/api/order" method="POST" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <h2 style={{ fontSize: '12px', textAlign: 'center', letterSpacing: '2px' }}>ORDER: {selectedProduct.name}</h2>
                <input type="hidden" name="product_name" value={selectedProduct.name} />
                <input type="hidden" name="final_price" value={calculatePrice(selectedProduct.priceText)} />
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <select name="size" required><option value="" disabled selected>SIZE</option><option>M</option><option>L</option><option>XL</option><option>XXL</option></select>
                  <input type="text" name="color" placeholder="COLOR" required />
                </div>
                <input type="text" name="name" placeholder="FULL NAME" required />
                <input type="tel" name="phone" placeholder="PHONE NUMBER" required />
                <textarea name="address" placeholder="SHIPPING ADDRESS" required style={{ minHeight: '60px' }}></textarea>

                <div style={{ padding: '15px', backgroundColor: '#050505', borderRadius: '15px', border: '1px solid #111' }}>
                  <select name="method" required onChange={(e) => setPaymentMethod(e.target.value)}>
                    <option value="" disabled selected>PAYMENT GATEWAY</option>
                    <option>Bkash</option><option>Nagad</option><option>Rocket</option><option>Upay</option><option>Cellfin</option>
                  </select>
                  {paymentMethod && <p style={{ fontSize: '10px', color: '#555', marginTop: '10px', textAlign: 'center' }}>SEND MONEY TO: {paymentNumbers[paymentMethod]}</p>}
                  <input type="tel" name="payment_no" placeholder="SENDER NO" required style={{ borderBottom: '1px solid #111', marginTop: '10px' }} />
                  <input type="text" name="txn_id" placeholder="TRANSACTION ID" required />
                </div>
                <button type="submit" className="btn-order" style={{ padding: '20px' }}>CONFIRM ORDER</button>
              </form>
            )}
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
  const readTxt = (file, def) => {
    const fullPath = path.join(cDir, file);
    return fs.existsSync(fullPath) ? fs.readFileSync(fullPath, 'utf8').trim() : def;
  };
  const images = fs.readdirSync(pDir).filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f));
  const allProducts = images.map(img => {
    const handle = path.parse(img).name;
    const dPath = path.join(dDir, `${handle}.txt`);
    let name = handle.toUpperCase(), desc = "", priceText = "1200 BDT";
    if (fs.existsSync(dPath)) {
      const content = fs.readFileSync(dPath, 'utf8').trim().split('\n');
      name = content[0];
      desc = content.slice(1).join('\n');
      const pLine = content.find(l => l.toLowerCase().includes('price'));
      priceText = pLine ? pLine.trim() : "1200 BDT";
    }
    return { id: handle, name, image: img, desc, priceText };
  });
  return { props: { allProducts, siteContent: { header: readTxt('header.txt', 'THE ONE. EVERYWHERE.'), about: readTxt('about.txt', ''), footer: readTxt('footer.txt', 'NOMAD BY SH | 2026') }, announcement: readTxt('announcement.txt', '') }, revalidate: 10 };
}
