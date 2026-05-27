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
    const shuffled = [...allProducts].sort(() => Math.random() - 0.5);
    setProducts(shuffled);
    const catMap = {};
    shuffled.forEach(p => {
      const catName = p.name.split(' ')[0];
      if (!catMap[catName]) catMap[catName] = [];
      catMap[catName].push(p);
    });
    setCategories(catMap);

    if (router.query.product) {
      const target = allProducts.find(p => p.id === router.query.product);
      if (target) { setSelectedProduct({ ...target, ref: router.query.ref || '' }); setIsModalOpen(true); }
    }
  }, [allProducts, router.query]);

  // প্রাইস লজিক (ইন্টারন্যাশনাল ফরম্যাট ঠিক রেখে)
  const calculateFinalPrice = (priceText) => {
    const numberOnly = priceText.replace(/[^0-9]/g, "");
    if (!numberOnly) return priceText;
    const discounted = Math.floor(parseInt(numberOnly) - (parseInt(numberOnly) * discountPercent / 100));
    return priceText.replace(numberOnly, discounted);
  };

  // উন্নত সার্চ লজিক (Case & Hyphen Insensitive)
  const filteredProducts = searchQuery.trim() === '' ? [] : products.filter(p => 
    p.name.toLowerCase().replace(/-/g, ' ').includes(searchQuery.toLowerCase().replace(/-/g, ' '))
  );

  return (
    <div style={{ backgroundColor: '#000', color: '#fff', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
      <Head><title>NOMAD | Premium</title></Head>

      <style>{`
        @keyframes luxuryFade { 0% { opacity: 0; transform: translateY(20px); } 100% { opacity: 1; transform: translateY(0); } }
        .product-card { animation: luxuryFade 1s ease forwards; margin-bottom: 60px; }
        .scroll-container { display: flex; overflow-x: auto; gap: 20px; padding: 10px 20px; scrollbar-width: none; }
        .scroll-container::-webkit-scrollbar { display: none; }
        .cat-item { min-width: 300px; background: #0a0a0a; border-radius: 30px; border: 1px solid #111; overflow: hidden; cursor: pointer; }
        .desc-line { display: grid; grid-template-columns: 85px 15px 1fr; font-size: 12px; color: #777; margin-bottom: 5px; }
        input, select, textarea { background: none; border: none; border-bottom: 1px solid #222; color: #fff; padding: 12px; outline: none; width: 100%; }
      `}</style>

      {/* Header */}
      <header style={{ textAlign: 'center', padding: '30px', borderBottom: '1px solid #111' }}>
        <h1 style={{ letterSpacing: '15px', fontSize: '24px', fontWeight: '900' }}>NOMAD</h1>
        <p style={{ fontSize: '7px', color: '#555', letterSpacing: '5px' }}>{siteContent.header}</p>
      </header>

      {/* Search */}
      <div style={{ maxWidth: '400px', margin: '20px auto', padding: '0 20px' }}>
        <div style={{ background: '#0a0a0a', border: isFocused ? '1px solid #fff' : '1px solid #111', borderRadius: '20px', padding: '15px' }}>
          <input type="text" placeholder="SEARCH PRODUCT" onFocus={()=>setIsFocused(true)} onBlur={()=>setIsFocused(false)} onChange={(e)=>setSearchQuery(e.target.value)} style={{ textAlign: 'center', border: 'none' }} />
        </div>
      </div>

      <main style={{ maxWidth: '450px', margin: '0 auto' }}>
        {searchQuery ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', padding: '20px' }}>
            {filteredProducts.map((p, i) => (
              <div key={i} onClick={() => { setSelectedProduct(p); setIsModalOpen(true); }} style={{ background: '#0a0a0a', padding: '10px', borderRadius: '15px' }}>
                <img src={`/products/${p.image}`} style={{ width: '100%', borderRadius: '10px' }} />
                <p style={{ fontSize: '11px', textAlign: 'center', marginTop: '10px' }}>{p.name}</p>
              </div>
            ))}
          </div>
        ) : viewCategory ? (
          /* See More View */
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '20px' }}>
              <span style={{ letterSpacing: '3px', fontSize: '12px' }}>{viewCategory}</span>
              <span onClick={() => setViewCategory(null)} style={{ fontSize: '10px', borderBottom: '1px solid #333' }}>BACK</span>
            </div>
            {categories[viewCategory].map((product, index) => (
              <div key={index} className="product-card" style={{ padding: '0 20px' }}>
                <img src={`/products/${product.image}`} style={{ width: '100%', borderRadius: '30px' }} />
                <div style={{ textAlign: 'center', marginTop: '20px' }}>
                  <h3 style={{ fontSize: '18px', letterSpacing: '2px' }}>{product.name}</h3>
                  <div style={{ margin: '15px 0' }}>
                    {product.desc.split('\n').map((line, i) => (
                      line.includes(':') ? (
                        <div key={i} className="desc-line"><span>{line.split(':')[0]}</span><span>:</span><span>{line.split(':')[1]}</span></div>
                      ) : <p key={i} style={{ fontSize: '12px', color: '#777' }}>{line}</p>
                    ))}
                  </div>
                  <p style={{ fontWeight: 'bold', margin: '10px 0' }}>{calculateFinalPrice(product.priceText)}</p>
                  <button onClick={() => { setSelectedProduct(product); setIsModalOpen(true); }} style={{ width: '100%', background: '#fff', color: '#000', padding: '15px', borderRadius: '12px', fontWeight: 'bold' }}>ORDER NOW</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Horizontal Home View */
          Object.keys(categories).map(cat => (
            <section key={cat}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '20px' }}>
                <span style={{ letterSpacing: '4px', fontSize: '12px' }}>{cat}</span>
                <span onClick={() => setViewCategory(cat)} style={{ fontSize: '10px', color: '#555' }}>SEE MORE</span>
              </div>
              <div className="scroll-container">
                {categories[cat].map((p, i) => (
                  <div key={i} className="cat-item" onClick={() => { setSelectedProduct(p); setIsModalOpen(true); }}>
                    <img src={`/products/${p.image}`} style={{ width: '100%' }} />
                    <div style={{ padding: '20px', textAlign: 'center' }}>
                      <p style={{ fontSize: '14px', letterSpacing: '2px' }}>{p.name}</p>
                      <p style={{ fontSize: '12px', color: '#555', margin: '10px 0' }}>{calculateFinalPrice(p.priceText)}</p>
                      <div style={{ background: '#fff', color: '#000', padding: '10px', borderRadius: '8px', fontSize: '10px', fontWeight: 'bold' }}>VIEW DETAILS</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))
        )}
      </main>

      {/* Footer (আগের স্টাইল) */}
      <footer style={{ textAlign: 'center', padding: '60px 20px', background: '#050505', marginTop: '40px' }}>
        <p style={{ fontSize: '11px', color: '#444', lineHeight: '2' }}>{siteContent.about}</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '30px', margin: '30px 0' }}>
          <a href="https://facebook.com/nomadbysh" style={{ color: '#fff', textDecoration: 'none', fontSize: '10px' }}>FACEBOOK</a>
          <a href="https://wa.me/8801521731371" style={{ color: '#fff', textDecoration: 'none', fontSize: '10px' }}>WHATSAPP</a>
        </div>
      </footer>

      {/* Modal - বড় ছবি + বিস্তারিত ডেসক্রিপশন + অরিজিনাল ফর্ম */}
      {isModalOpen && selectedProduct && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.98)', zIndex: 9999, overflowY: 'auto', padding: '20px' }}>
          <div style={{ maxWidth: '400px', margin: '0 auto', background: '#0a0a0a', borderRadius: '30px', padding: '30px', position: 'relative' }}>
            <button onClick={()=>setIsModalOpen(false)} style={{ position: 'absolute', right: '20px', top: '20px', background: 'none', border: 'none', color: '#fff', fontSize: '24px' }}>&times;</button>
            
            <img src={`/products/${selectedProduct.image}`} style={{ width: '100%', borderRadius: '20px' }} />
            <h2 style={{ textAlign: 'center', margin: '20px 0', fontSize: '18px' }}>{selectedProduct.name}</h2>
            
            {/* ডেসক্রিপশন অংশ */}
            <div style={{ marginBottom: '25px' }}>
              {selectedProduct.desc.split('\n').map((line, i) => (
                <div key={i} className="desc-line"><span>{line.split(':')[0]}</span><span>:</span><span>{line.split(':')[1]}</span></div>
              ))}
            </div>

            <p style={{ textAlign: 'center', fontSize: '20px', fontWeight: 'bold', marginBottom: '20px' }}>{calculateFinalPrice(selectedProduct.priceText)}</p>

            {/* অরিজিনাল ফর্ম সব গেটওয়ে সহ */}
            <form action="/api/order" method="POST" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <input type="hidden" name="product_name" value={selectedProduct.name} />
              <input type="hidden" name="final_price" value={calculateFinalPrice(selectedProduct.priceText)} />
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <select name="size" required><option value="" disabled selected>SIZE</option><option>M</option><option>L</option><option>XL</option><option>XXL</option></select>
                <input type="text" name="color" placeholder="COLOR" required />
              </div>
              <input type="text" name="name" placeholder="FULL NAME" required />
              <input type="tel" name="phone" placeholder="PHONE" required />
              <textarea name="address" placeholder="ADDRESS" required></textarea>

              <div style={{ background: '#050505', padding: '15px', borderRadius: '15px' }}>
                <select name="method" required onChange={(e)=>setPaymentMethod(e.target.value)}>
                  <option value="" disabled selected>GATEWAY</option>
                  <option>Bkash</option><option>Nagad</option><option>Rocket</option><option>Upay</option><option>Cellfin</option>
                </select>
                {paymentMethod && <p style={{ fontSize: '10px', color: '#555', marginTop: '10px' }}>SEND MONEY TO: {paymentNumbers[paymentMethod]}</p>}
                <input type="tel" name="payment_no" placeholder="SENDER NO" required style={{ marginTop: '10px' }} />
                <input type="text" name="txn_id" placeholder="TRANSACTION ID" required />
              </div>
              <button type="submit" style={{ background: '#fff', color: '#000', padding: '18px', borderRadius: '12px', fontWeight: 'bold' }}>CONFIRM ORDER</button>
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

  return { props: { allProducts, siteContent: { header: readTxt('header.txt', 'THE ONE. EVERYWHERE.'), about: readTxt('about.txt', ''), footer: readTxt('footer.txt', '') }, announcement: readTxt('announcement.txt', '') }, revalidate: 10 };
}
