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
  const [selectedProduct, setSelectedProduct] = useState({ id: '', name: '', priceText: '', ref: '' });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [viewCategory, setViewCategory] = useState(null);

  const paymentNumbers = {
    'Bkash': '01521731371', 'Nagad': '01521731371', 'Rocket': '01521731371', 'Upay': '01521731371', 'Cellfin': '01521731371'
  };

  const discountRegex = /(\d+)%/;
  const discountMatch = announcement.match(discountRegex);
  const discountPercent = discountMatch ? parseInt(discountMatch[1]) : 0;

  useEffect(() => {
    const shuffledProducts = [...allProducts].sort(() => Math.random() - 0.5);
    setProducts(shuffledProducts);
    
    const catMap = {};
    shuffledProducts.forEach(p => {
      const catName = p.name.split(' ')[0];
      if (!catMap[catName]) catMap[catName] = [];
      catMap[catName].push(p);
    });
    setCategories(catMap);

    if (router.query.product) {
      const target = allProducts.find(p => p.id === router.query.product);
      if (target) {
        setSelectedProduct({ ...target, ref: router.query.ref || '' });
        setIsModalOpen(true);
      }
    }
  }, [allProducts, router.query]);

  // ডেসক্রিপশন থেকে আসা Price 1000 BDT থেকে শুধু সংখ্যা বের করে ডিসকাউন্ট করা
  const getFinalPriceDisplay = (priceText) => {
    const numberOnly = priceText.replace(/[^0-9]/g, "");
    const originalPrice = parseInt(numberOnly) || 0;
    if (discountPercent > 0) {
      const discounted = Math.floor(originalPrice - (originalPrice * discountPercent / 100));
      return priceText.replace(numberOnly, discounted);
    }
    return priceText;
  };

  const filteredProducts = searchQuery.trim() === '' 
    ? [] 
    : products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div style={{ backgroundColor: '#000', color: '#fff', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
      <Head>
        <title>NOMAD | Premium Store</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0"/>
      </Head>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .premium-card { animation: fadeIn 0.8s ease forwards; background: #080808; border-radius: 35px; border: 1px solid #111; overflow: hidden; }
        .scroll-container { display: flex; overflow-x: auto; gap: 15px; padding: 10px 20px; scrollbar-width: none; scroll-behavior: smooth; }
        .scroll-container::-webkit-scrollbar { display: none; }
        .cat-item { min-width: 85vw; max-width: 320px; }
        .price-tag { font-size: 16px; letter-spacing: 1px; color: #fff; font-weight: 300; margin-bottom: 15px; }
        .order-btn { width: 100%; background: #fff; color: #000; border: none; padding: 18px; border-radius: 15px; font-weight: 900; font-size: 11px; letter-spacing: 3px; cursor: pointer; text-transform: uppercase; }
        .cat-title { font-size: 13px; letter-spacing: 5px; margin: 40px 20px 20px; text-transform: uppercase; display: flex; justify-content: space-between; align-items: center; color: #666; }
        .see-more { font-size: 10px; border-bottom: 1px solid #333; color: #fff; padding-bottom: 2px; }
        .search-box { background: #0a0a0a; border: 1px solid #151515; border-radius: 20px; padding: 15px; text-align: center; margin: 20px; transition: 0.3s; }
        .search-input::placeholder { color: #333; letter-spacing: 2px; font-size: 10px; }
      `}</style>

      {/* Header */}
      <header style={{ textAlign: 'center', padding: '40px 20px', borderBottom: '1px solid #0d0d0d' }}>
        <h1 style={{ letterSpacing: '18px', fontSize: '28px', margin: 0, fontWeight: '900' }}>NOMAD</h1>
        <p style={{ fontSize: '7px', color: '#444', marginTop: '8px', letterSpacing: '6px' }}>{siteContent.header}</p>
      </header>

      {/* Announcement & Search */}
      <div className="search-box" style={{ borderColor: isFocused ? '#333' : '#151515' }}>
        {announcement && !searchQuery && <p style={{ fontSize: '10px', letterSpacing: '2px', marginBottom: '12px', fontWeight: 'bold' }}>{announcement}</p>}
        <input 
          type="text" className="search-input" placeholder="DISCOVER COLLECTION" 
          onFocus={() => setIsFocused(true)} onBlur={() => setIsFocused(false)}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ background: 'none', border: 'none', color: '#fff', textAlign: 'center', width: '100%', outline: 'none', fontSize: '11px', letterSpacing: '2px' }}
        />
      </div>

      <main>
        {searchQuery ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', padding: '20px' }}>
            {filteredProducts.map((p, i) => (
              <div key={i} className="premium-card" onClick={() => { setSelectedProduct({...p, ref: ''}); setIsModalOpen(true); }} style={{ padding: '10px' }}>
                <img src={`/products/${p.image}`} style={{ width: '100%', borderRadius: '25px' }} />
                <p style={{ fontSize: '10px', textAlign: 'center', marginTop: '10px', letterSpacing: '1px' }}>{p.name}</p>
              </div>
            ))}
          </div>
        ) : viewCategory ? (
          <div className="premium-card" style={{ margin: '0 20px', border: 'none' }}>
            <div className="cat-title"><span>{viewCategory} Collection</span><span onClick={() => setViewCategory(null)} className="see-more">BACK</span></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', paddingBottom: '100px' }}>
              {categories[viewCategory].map((p, i) => (
                <div key={i} onClick={() => { setSelectedProduct({...p, ref: ''}); setIsModalOpen(true); }} style={{ background: '#080808', padding: '10px', borderRadius: '25px' }}>
                  <img src={`/products/${p.image}`} style={{ width: '100%', borderRadius: '18px' }} />
                  <p style={{ fontSize: '10px', textAlign: 'center', margin: '10px 0 5px' }}>{p.name}</p>
                  <p style={{ fontSize: '12px', fontWeight: 'bold', textAlign: 'center' }}>{getFinalPriceDisplay(p.priceText)}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          Object.keys(categories).map(cat => (
            <section key={cat} style={{ marginBottom: '20px' }}>
              <div className="cat-title"><span>{cat}</span><span onClick={() => setViewCategory(cat)} className="see-more">SEE MORE</span></div>
              <div className="scroll-container">
                {categories[cat].map((p, i) => (
                  <div key={i} className="cat-item">
                    <div className="premium-card">
                      <img src={`/products/${p.image}`} style={{ width: '100%', display: 'block' }} />
                      <div style={{ padding: '25px', textAlign: 'center' }}>
                        <h3 style={{ fontSize: '16px', letterSpacing: '3px', marginBottom: '10px', fontWeight: '400' }}>{p.name}</h3>
                        <div className="price-tag">
                          {getFinalPriceDisplay(p.priceText)}
                          {discountPercent > 0 && <span style={{ textDecoration: 'line-through', color: '#333', fontSize: '12px', marginLeft: '10px' }}>{p.priceText}</span>}
                        </div>
                        <button className="order-btn" onClick={() => { setSelectedProduct({...p, ref: ''}); setIsModalOpen(true); }}>ORDER NOW</button>
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
      <footer style={{ textAlign: 'center', padding: '80px 20px', background: '#050505', marginTop: '60px' }}>
        <p style={{ fontSize: '11px', color: '#444', lineHeight: '2', letterSpacing: '1px', marginBottom: '40px' }}>{siteContent.about}</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '30px', marginBottom: '40px' }}>
          <a href="https://facebook.com/nomadbysh" style={{ color: '#fff', textDecoration: 'none', fontSize: '9px', letterSpacing: '2px' }}>FB</a>
          <a href="https://wa.me/8801521731371" style={{ color: '#fff', textDecoration: 'none', fontSize: '9px', letterSpacing: '2px' }}>WA</a>
        </div>
        <p style={{ letterSpacing: '6px', fontSize: '8px', color: '#1a1a1a' }}>{siteContent.footer}</p>
      </footer>

      {/* Order Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.99)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#080808', width: '100%', maxWidth: '400px', padding: '40px 25px', borderRadius: '40px', border: '1px solid #111', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontSize: '14px', textAlign: 'center', letterSpacing: '4px', marginBottom: '25px' }}>{selectedProduct.name}</h2>
            
            <form action="/api/order" method="POST" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <input type="hidden" name="product_name" value={selectedProduct.name} />
              <input type="hidden" name="final_price" value={getFinalPriceDisplay(selectedProduct.priceText)} />
              <input type="hidden" name="fb_ref" value={selectedProduct.ref} />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <select name="size" required style={{ background: '#000', border: '1px solid #111', color: '#fff', padding: '15px', borderRadius: '12px' }}><option value="" disabled selected>SIZE</option><option>M</option><option>L</option><option>XL</option><option>XXL</option></select>
                <input type="text" name="color" placeholder="COLOR" required style={{ background: '#000', border: '1px solid #111', color: '#fff', padding: '15px', borderRadius: '12px' }} />
              </div>

              <input type="text" name="name" placeholder="YOUR NAME" required style={{ background: '#000', border: '1px solid #111', color: '#fff', padding: '15px', borderRadius: '12px' }} />
              <input type="tel" name="phone" placeholder="PHONE NUMBER" required style={{ background: '#000', border: '1px solid #111', color: '#fff', padding: '15px', borderRadius: '12px' }} />
              <textarea name="address" placeholder="SHIPPING ADDRESS" required style={{ background: '#000', border: '1px solid #111', color: '#fff', padding: '15px', borderRadius: '12px', minHeight: '80px' }}></textarea>

              <div style={{ padding: '20px', background: '#000', borderRadius: '15px', border: '1px solid #111' }}>
                <select name="method" required style={{ width: '100%', background: 'none', color: '#fff', border: 'none', marginBottom: '10px' }} onChange={(e) => setPaymentMethod(e.target.value)}>
                  <option value="" disabled selected>PAYMENT GATEWAY</option>
                  <option>Bkash</option><option>Nagad</option>
                </select>
                {paymentMethod && <p style={{ fontSize: '11px', textAlign: 'center', color: '#555' }}>SEND MONEY TO: {paymentNumbers[paymentMethod]}</p>}
                <input type="text" name="txn_id" placeholder="TRANSACTION ID" required style={{ width: '100%', background: 'none', border: 'none', borderBottom: '1px solid #111', marginTop: '10px' }} />
              </div>

              <button type="submit" className="order-btn">CONFIRM ORDER</button>
              <button type="button" onClick={() => setIsModalOpen(false)} style={{ color: '#333', background: 'none', border: 'none', fontSize: '10px', marginTop: '10px' }}>CANCEL</button>
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

  const readTxt = (file, def) => {
    const fullPath = path.join(cDir, file);
    return fs.existsSync(fullPath) ? fs.readFileSync(fullPath, 'utf8').trim() : def;
  };

  const images = fs.readdirSync(pDir).filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f));
  const allProducts = images.map(img => {
    const handle = path.parse(img).name;
    const dPath = path.join(dDir, `${handle}.txt`);
    let name = handle.toUpperCase(), priceText = "Price 1200 BDT";

    if (fs.existsSync(dPath)) {
      const content = fs.readFileSync(dPath, 'utf8').trim().split('\n');
      name = content[0];
      const pLine = content.find(l => l.toLowerCase().includes('price'));
      // এখানে ডেসক্রিপশন ফাইলে Price 1000 BDT থাকলে সেটিই নেবে
      priceText = pLine ? pLine.trim() : "Price 1200 BDT";
    }

    return { id: handle, name, image: img, priceText };
  });

  return { props: { allProducts, siteContent: { header: readTxt('header.txt', 'THE ONE. EVERYWHERE.'), about: readTxt('about.txt', 'Luxury Redefined.'), footer: readTxt('footer.txt', 'NOMAD BY SH | 2026') }, announcement: readTxt('announcement.txt', '') }, revalidate: 10 };
}
