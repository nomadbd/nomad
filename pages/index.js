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
  const [selectedProduct, setSelectedProduct] = useState({ id: '', name: '', price: 0, ref: '' });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [viewCategory, setViewCategory] = useState(null); // See More এর জন্য

  const paymentNumbers = {
    'Bkash': '01521731371', 'Nagad': '01521731371', 'Rocket': '01521731371', 'Upay': '01521731371', 'Cellfin': '01521731371'
  };

  // ডিসকাউন্ট লজিক: শুধু সংখ্যার পরে % থাকলে কাজ করবে
  const discountRegex = /(\d+)%/;
  const discountMatch = announcement.match(discountRegex);
  const discountPercent = discountMatch ? parseInt(discountMatch[1]) : 0;

  useEffect(() => {
    const shuffledProducts = [...allProducts].sort(() => Math.random() - 0.5);
    setProducts(shuffledProducts);
    
    // ক্যাটাগরি তৈরি
    const catMap = {};
    shuffledProducts.forEach(p => {
      const catName = p.name.split(' ')[0];
      if (!catMap[catName]) catMap[catName] = [];
      catMap[catName].push(p);
    });
    setCategories(catMap);

    // অটোমেটিক প্রডাক্ট লিংক হ্যান্ডেলার সাথে ফেসবুক রিফ
    if (router.query.product) {
      const target = allProducts.find(p => p.id === router.query.product);
      if (target) {
        setSelectedProduct({ 
          ...target, 
          ref: router.query.ref || '' 
        });
        setIsModalOpen(true);
      }
    }
  }, [allProducts, router.query]);

  const calculatePrice = (price) => {
    const p = parseFloat(price.replace(/[^0-9.-]+/g, ""));
    return discountPercent > 0 ? Math.floor(p - (p * discountPercent / 100)) : p;
  };

  const filteredProducts = searchQuery.trim() === '' 
    ? [] 
    : products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div style={{ backgroundColor: '#000', color: '#fff', minHeight: '100vh', fontFamily: 'Inter, sans-serif', margin: 0 }}>
      
      <Head>
        <title>NOMAD | Premium Clothing Brand</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <style>{`
        @keyframes luxuryFade { 0% { opacity: 0; transform: translateY(20px); } 100% { opacity: 1; transform: translateY(0); } }
        .product-card { animation: luxuryFade 1.2s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
        .scroll-container { display: flex; overflow-x: auto; gap: 20px; padding: 10px 20px; scrollbar-width: none; }
        .scroll-container::-webkit-scrollbar { display: none; }
        .cat-item { min-width: 280px; background: #0a0a0a; border-radius: 30px; padding: 12px; border: 1px solid #111; transition: transform 0.3s; }
        .cat-title { font-size: 13px; letter-spacing: 4px; margin: 40px 20px 15px; text-transform: uppercase; display: flex; justify-content: space-between; align-items: center; color: #fff; }
        .see-more { font-size: 10px; color: #555; cursor: pointer; border-bottom: 1px solid #222; letter-spacing: 1px; }
        input, select, textarea { background: none; border: none; border-bottom: 1px solid #222; color: #fff; padding: 12px; outline: none; font-size: 13px; width: 100%; box-sizing: border-box; }
        input:focus, select:focus, textarea:focus { border-bottom-color: #fff; }
        .search-input::placeholder { color: #444; letter-spacing: 2px; text-transform: uppercase; font-size: 10px; }
        option { background-color: #000; color: #fff; }
        .desc-line { display: grid; grid-template-columns: 85px 15px 1fr; font-size: 12px; color: #777; text-align: left; }
      `}</style>

      <header style={{ textAlign: 'center', padding: '25px 20px', position: 'sticky', top: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(15px)', zIndex: 100, borderBottom: '1px solid #111' }}>
        <h1 style={{ letterSpacing: '15px', fontSize: '24px', margin: 0, fontWeight: '900' }}>NOMAD</h1>
        <p style={{ fontSize: '7px', color: '#555', marginTop: '5px', letterSpacing: '5px', textTransform: 'uppercase' }}>{siteContent.header}</p>
      </header>

      {/* সার্চ এবং অ্যানাউন্সমেন্ট */}
      <div style={{ maxWidth: '410px', margin: '20px auto 10px auto', padding: '0 20px' }}>
        <div style={{ backgroundColor: '#0a0a0a', border: isFocused ? '1.5px solid #fff' : '1px solid #1a1a1a', padding: '20px', borderRadius: '25px', textAlign: 'center' }}>
          {announcement && !searchQuery && (
            <p style={{ fontSize: '11px', letterSpacing: '2px', color: '#fff', margin: '0 0 15px 0', textTransform: 'uppercase', fontWeight: 'bold' }}>{announcement}</p>
          )}
          <input type="text" className="search-input" placeholder="SEARCH PRODUCT" value={searchQuery} onFocus={() => setIsFocused(true)} onBlur={() => setIsFocused(false)} onChange={(e) => setSearchQuery(e.target.value)} style={{ textAlign: 'center', border: 'none', background: 'none', fontSize: '11px', letterSpacing: '3px', color: '#fff', width: '100%', outline: 'none' }} />
        </div>
      </div>

      <main style={{ maxWidth: '500px', margin: '0 auto' }}>
        {searchQuery ? (
          /* সার্চ রেজাল্ট - গ্রিড ভিউ */
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', padding: '20px' }}>
            {filteredProducts.map((p, i) => (
              <div key={i} onClick={() => { setSelectedProduct({...p, ref: ''}); setIsModalOpen(true); }} style={{ cursor: 'pointer', background: '#0a0a0a', padding: '10px', borderRadius: '15px' }}>
                <img src={`/products/${p.image}`} style={{ width: '100%', borderRadius: '10px' }} />
                <p style={{ fontSize: '11px', marginTop: '10px', textAlign: 'center' }}>{p.name}</p>
              </div>
            ))}
          </div>
        ) : viewCategory ? (
          /* See More ভিউ - গ্রিড ভিউ */
          <div className="product-card">
            <div className="cat-title"><span>{viewCategory} Collection</span><span onClick={() => setViewCategory(null)} className="see-more">BACK</span></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', padding: '20px' }}>
              {categories[viewCategory].map((p, i) => (
                <div key={i} onClick={() => { setSelectedProduct({...p, ref: ''}); setIsModalOpen(true); }} style={{ cursor: 'pointer', background: '#0a0a0a', padding: '10px', borderRadius: '15px' }}>
                  <img src={`/products/${p.image}`} style={{ width: '100%', borderRadius: '10px' }} />
                  <p style={{ fontSize: '11px', margin: '10px 0 5px', textAlign: 'center' }}>{p.name}</p>
                  <p style={{ fontSize: '12px', fontWeight: 'bold', textAlign: 'center' }}>৳{calculatePrice(p.price)}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* হোম পেজ - হরিজন্টাল স্ক্রল */
          Object.keys(categories).map(cat => (
            <section key={cat} className="product-card" style={{ opacity: 0 }}>
              <div className="cat-title"><span>{cat}</span><span onClick={() => setViewCategory(cat)} className="see-more">SEE MORE</span></div>
              <div className="scroll-container">
                {categories[cat].map((p, i) => (
                  <div key={i} className="cat-item">
                    <img src={`/products/${p.image}`} style={{ width: '100%', borderRadius: '20px' }} />
                    <div style={{ padding: '15px 5px', textAlign: 'center' }}>
                      <h4 style={{ fontSize: '14px', margin: '0 0 8px 0', letterSpacing: '1px' }}>{p.name}</h4>
                      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '16px', fontWeight: 'bold' }}>৳{calculatePrice(p.price)}</span>
                        {discountPercent > 0 && <span style={{ textDecoration: 'line-through', color: '#444', fontSize: '11px' }}>৳{p.price}</span>}
                      </div>
                      <button onClick={() => { setSelectedProduct({...p, ref: ''}); setIsModalOpen(true); }} style={{ width: '100%', padding: '15px', marginTop: '18px', background: '#fff', color: '#000', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '10px', letterSpacing: '2px', cursor: 'pointer' }}>ORDER NOW</button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))
        )}
      </main>

      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.98)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ backgroundColor: '#0a0a0a', width: '100%', maxWidth: '400px', padding: '45px 30px', borderRadius: '35px', border: '1px solid #1a1a1a', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>
            <button onClick={() => { setIsModalOpen(false); setPaymentMethod(''); }} style={{ position: 'absolute', top: '20px', right: '30px', background: 'none', border: 'none', color: '#fff', fontSize: '22px', cursor: 'pointer' }}>&times;</button>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '11px', letterSpacing: '4px', fontWeight: 'bold', textTransform: 'uppercase' }}>{selectedProduct.name}</h2>
              <div style={{ textAlign: 'center', margin: '15px 0', padding: '15px', background: '#050505', borderRadius: '20px' }}>
                <h3 style={{ fontSize: '24px', margin: 0 }}>৳{calculatePrice(selectedProduct.price || "0")}</h3>
                {discountPercent > 0 && <p style={{ fontSize: '10px', color: '#00ff00', margin: 0 }}>{discountPercent}% OFF APPLIED</p>}
              </div>
            </div>

            <form action="/api/order" method="POST" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <input type="hidden" name="product_name" value={selectedProduct.name} />
              <input type="hidden" name="final_price" value={calculatePrice(selectedProduct.price || "0")} />
              <input type="hidden" name="fb_ref" value={selectedProduct.ref} />
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <select name="size" required><option value="" disabled selected>SIZE</option><option value="M">M</option><option value="L">L</option><option value="XL">XL</option><option value="XXL">XXL</option></select>
                <input type="text" name="color" placeholder="COLOR" required />
              </div>
              <input type="text" name="name" placeholder="FULL NAME" required />
              <input type="tel" name="phone" placeholder="PHONE NUMBER" required />
              <textarea name="address" placeholder="SHIPPING ADDRESS" required style={{ minHeight: '60px' }}></textarea>

              <div style={{ padding: '18px', backgroundColor: '#050505', borderRadius: '20px', border: '1px solid #111' }}>
                <select name="method" required style={{ marginBottom: '10px' }} onChange={(e) => setPaymentMethod(e.target.value)}>
                  <option value="" disabled selected>SELECT GATEWAY</option>
                  <option value="Bkash">Bkash</option><option value="Nagad">Nagad</option><option value="Rocket">Rocket</option><option value="Upay">Upay</option><option value="Cellfin">Cellfin</option>
                </select>
                {paymentMethod && (
                  <div style={{ padding: '10px', marginBottom: '15px', border: '1px dashed #333', borderRadius: '10px', textAlign: 'center' }}>
                    <p style={{ fontSize: '9px', color: '#777', margin: '0 0 5px 0' }}>SEND MONEY TO:</p>
                    <p style={{ fontSize: '14px', letterSpacing: '2px', fontWeight: 'bold', color: '#fff', margin: 0 }}>{paymentNumbers[paymentMethod]}</p>
                  </div>
                )}
                <input type="tel" name="payment_no" placeholder="SENDER NO" required style={{ marginBottom: '15px' }} />
                <input type="text" name="txn_id" placeholder="TRANSACTION ID" required />
              </div>
              <button type="submit" style={{ backgroundColor: '#fff', color: '#000', border: 'none', padding: '20px', borderRadius: '18px', fontWeight: '900', letterSpacing: '3px', fontSize: '11px', cursor: 'pointer' }}>CONFIRM ORDER</button>
            </form>
          </div>
        </div>
      )}

      <footer style={{ textAlign: 'center', padding: '80px 20px', background: '#050505', borderTop: '1px solid #111' }}>
        <p style={{ maxWidth: '300px', margin: '0 auto 40px auto', fontSize: '11px', color: '#555', lineHeight: '2' }}>{siteContent.about}</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '30px', marginBottom: '40px' }}>
          <a href="https://facebook.com/nomadbysh" target="_blank" rel="noopener noreferrer" style={{ color: '#fff', textDecoration: 'none', fontSize: '10px', letterSpacing: '2px' }}>FACEBOOK</a>
          <a href="mailto:nomadbysh@gmail.com" style={{ color: '#fff', textDecoration: 'none', fontSize: '10px', letterSpacing: '2px' }}>EMAIL</a>
          <a href="https://wa.me/8801521731371" style={{ color: '#fff', textDecoration: 'none', fontSize: '10px', letterSpacing: '2px' }}>WHATSAPP</a>
        </div>
        <p style={{ letterSpacing: '6px', fontSize: '8px', color: '#222' }}>{siteContent.footer}</p>
      </footer>
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
    let name = handle.toUpperCase();
    let price = "0";

    if (fs.existsSync(dPath)) {
      const content = fs.readFileSync(dPath, 'utf8').trim().split('\n');
      name = content[0];
      const pLine = content.find(l => l.toLowerCase().includes('price'));
      price = pLine ? pLine.split(':')[1].trim() : "1200";
    }

    return { id: handle, name: name.toUpperCase(), image: img, price: price };
  });

  return { 
    props: { 
      allProducts: JSON.parse(JSON.stringify(allProducts)), 
      siteContent: {
        header: readTxt('header.txt', 'THE ONE. EVERYWHERE.'),
        about: readTxt('about.txt', 'Luxury and utility redefined.'),
        footer: readTxt('footer.txt', 'NOMAD BY SH | 2026')
      }, 
      announcement: readTxt('announcement.txt', '') 
    }, 
    revalidate: 10 
  };
}
