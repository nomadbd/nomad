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
  const [modalType, setModalType] = useState(null);
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
      if (target) { setSelectedProduct({ ...target, ref: router.query.ref || '' }); setModalType('details'); setIsModalOpen(true); }
    }
  }, [allProducts, router.query]);

  const calculatePrice = (priceText) => {
    const numberOnly = priceText.replace(/[^0-9]/g, "");
    if (!numberOnly || discountPercent === 0) return priceText;
    const discounted = Math.floor(parseInt(numberOnly) - (parseInt(numberOnly) * discountPercent / 100));
    return priceText.replace(numberOnly, discounted);
  };

  const filteredProducts = searchQuery.trim() === '' 
    ? products 
    : products.filter(p => p.name.toLowerCase().replace(/-/g, ' ').includes(searchQuery.toLowerCase().replace(/-/g, ' ')));

  return (
    <div style={{ backgroundColor: '#000', color: '#fff', minHeight: '100vh', fontFamily: 'Inter, sans-serif', overflowX: 'hidden' }}>
      <Head>
        <title>NOMAD | Premium Brand</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>

      <style>{`
        * { box-sizing: border-box; }
        .scroll-container { 
          display: flex; overflow-x: auto; gap: 20px; padding: 10px 20px; scrollbar-width: none; 
          scroll-snap-type: x mandatory; justify-content: flex-start;
        }
        .scroll-container::-webkit-scrollbar { display: none; }
        .cat-item { 
          min-width: 85vw; scroll-snap-align: center; background: #0a0a0a; border-radius: 35px; 
          border: 1px solid #1a1a1a; overflow: hidden; margin: 0 auto;
        }
        .btn-flex { display: flex; gap: 10px; padding: 0 20px 20px; }
        .btn-details { flex: 1; background: #111; color: #fff; border: 1px solid #222; padding: 15px; border-radius: 15px; font-weight: bold; font-size: 11px; letter-spacing: 1px; }
        .btn-order { flex: 1; background: #fff; color: #000; border: none; padding: 15px; border-radius: 15px; font-weight: bold; font-size: 11px; letter-spacing: 1px; }
        .desc-line { display: grid; grid-template-columns: 85px 15px 1fr; font-size: 12px; color: #777; margin-bottom: 5px; }
        .cancel-btn { background: none; border: none; color: #555; font-size: 11px; letter-spacing: 2px; margin-top: 20px; cursor: pointer; text-transform: uppercase; width: 100%; text-align: center; }
      `}</style>

      {/* Header */}
      <header style={{ textAlign: 'center', padding: '40px 20px' }}>
        <h1 style={{ letterSpacing: '15px', fontSize: '26px', fontWeight: '900', margin: 0 }}>NOMAD</h1>
        <p style={{ fontSize: '7px', color: '#444', letterSpacing: '5px', marginTop: '8px' }}>{siteContent.header}</p>
      </header>

      {/* Search & Announcement (সার্চ এখানেই আছে) */}
      <div style={{ maxWidth: '400px', margin: '0 auto 30px', padding: '0 20px' }}>
        <div style={{ background: '#0a0a0a', border: isFocused ? '1px solid #fff' : '1px solid #111', borderRadius: '25px', padding: '20px', textAlign: 'center' }}>
          {announcement && !searchQuery && <p style={{ fontSize: '11px', letterSpacing: '2px', fontWeight: 'bold', marginBottom: '15px' }}>{announcement}</p>}
          <input 
            type="text" placeholder="SEARCH PRODUCT" 
            onFocus={()=>setIsFocused(true)} onBlur={()=>setIsFocused(false)} 
            onChange={(e)=>setSearchQuery(e.target.value)} 
            style={{ background: 'none', border: 'none', color: '#fff', textAlign: 'center', width: '100%', outline: 'none', fontSize: '11px', letterSpacing: '2px' }} 
          />
        </div>
      </div>

      <main>
        {searchQuery && searchQuery.trim() !== '' ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', padding: '20px' }}>
            {filteredProducts.map((p, i) => (
              <div key={i} onClick={() => { setSelectedProduct(p); setModalType('details'); setIsModalOpen(true); }} style={{ background: '#0a0a0a', padding: '10px', borderRadius: '20px', border: '1px solid #111' }}>
                <img src={`/products/${p.image}`} style={{ width: '100%', borderRadius: '15px' }} />
                <p style={{ fontSize: '10px', textAlign: 'center', marginTop: '10px' }}>{p.name}</p>
              </div>
            ))}
          </div>
        ) : viewCategory ? (
          <div style={{ padding: '0 20px' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', margin: '20px 0' }}>
              <span style={{ fontSize: '12px', letterSpacing: '3px' }}>{viewCategory} COLLECTION</span>
              <span onClick={() => setViewCategory(null)} style={{ fontSize: '10px', borderBottom: '1px solid #333' }}>BACK</span>
            </div>
            {categories[viewCategory].map((p, i) => (
              <div key={i} style={{ marginBottom: '50px', background: '#0a0a0a', borderRadius: '35px', overflow: 'hidden', border: '1px solid #1a1a1a' }}>
                <img src={`/products/${p.image}`} style={{ width: '100%' }} />
                <h3 style={{ textAlign: 'center', fontSize: '18px', margin: '20px 0' }}>{p.name}</h3>
                <div className="btn-flex">
                  <button className="btn-details" onClick={() => { setSelectedProduct(p); setModalType('details'); setIsModalOpen(true); }}>DETAILS</button>
                  <button className="btn-order" onClick={() => { setSelectedProduct(p); setModalType('order'); setIsModalOpen(true); }}>ORDER NOW</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          Object.keys(categories).map(cat => (
            <section key={cat} style={{ marginBottom: '40px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 30px 15px' }}>
                <span style={{ fontSize: '12px', letterSpacing: '4px', color: '#555' }}>{cat}</span>
                <span onClick={() => setViewCategory(cat)} style={{ fontSize: '10px', borderBottom: '1px solid #222' }}>SEE MORE</span>
              </div>
              <div className="scroll-container">
                {categories[cat].map((p, i) => (
                  <div key={i} className="cat-item">
                    <img src={`/products/${p.image}`} style={{ width: '100%', display: 'block' }} />
                    <div style={{ padding: '25px 0', textAlign: 'center' }}>
                      <p style={{ fontSize: '16px', letterSpacing: '2px', marginBottom: '20px' }}>{p.name}</p>
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
      <footer style={{ textAlign: 'center', padding: '60px 20px', background: '#050505', marginTop: '40px', borderTop: '1px solid #111' }}>
        <p style={{ fontSize: '11px', color: '#444', lineHeight: '2', marginBottom: '30px' }}>{siteContent.about}</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '25px', marginBottom: '30px' }}>
          <a href="https://facebook.com/nomadbysh" style={{ color: '#fff', textDecoration: 'none', fontSize: '10px' }}>FACEBOOK</a>
          <a href="mailto:contact@nomad.com" style={{ color: '#fff', textDecoration: 'none', fontSize: '10px' }}>EMAIL</a>
          <a href="https://wa.me/8801521731371" style={{ color: '#fff', textDecoration: 'none', fontSize: '10px' }}>WHATSAPP</a>
        </div>
        <p style={{ letterSpacing: '6px', fontSize: '8px', color: '#222' }}>{siteContent.footer}</p>
      </footer>

      {/* Modal */}
      {isModalOpen && selectedProduct && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.98)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#0a0a0a', width: '100%', maxWidth: '400px', padding: '40px 25px', borderRadius: '35px', border: '1px solid #1a1a1a', maxHeight: '90vh', overflowY: 'auto' }}>
            
            {modalType === 'details' ? (
              <div>
                <img src={`/products/${selectedProduct.image}`} style={{ width: '100%', borderRadius: '20px' }} />
                <h2 style={{ textAlign: 'center', margin: '20px 0' }}>{selectedProduct.name}</h2>
                <div style={{ marginBottom: '20px' }}>
                  {selectedProduct.desc.split('\n').map((line, i) => (
                    line.includes(':') ? (
                      <div key={i} className="desc-line"><span>{line.split(':')[0]}</span><span>:</span><span>{line.split(':')[1]}</span></div>
                    ) : <p key={i} style={{ fontSize: '12px', color: '#777', textAlign: 'center' }}>{line}</p>
                  ))}
                </div>
                <p style={{ textAlign: 'center', fontSize: '20px', fontWeight: 'bold' }}>{calculatePrice(selectedProduct.priceText)}</p>
                <button className="btn-order" style={{ width: '100%', marginTop: '20px', padding: '18px' }} onClick={()=>setModalType('order')}>PROCEED TO ORDER</button>
                <button className="cancel-btn" onClick={()=>setIsModalOpen(false)}>Cancel</button>
              </div>
            ) : (
              <form action="/api/order" method="POST" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <h2 style={{ fontSize: '14px', textAlign: 'center', marginBottom: '10px' }}>ORDER: {selectedProduct.name}</h2>
                <input type="hidden" name="product_name" value={selectedProduct.name} />
                <input type="hidden" name="final_price" value={calculatePrice(selectedProduct.priceText)} />
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <select name="size" required style={{ background: '#000', border: '1px solid #222', color: '#fff', padding: '12px', borderRadius: '10px' }}><option value="" disabled selected>SIZE</option><option>M</option><option>L</option><option>XL</option><option>XXL</option></select>
                  <input type="text" name="color" placeholder="COLOR" required style={{ background: '#000', border: '1px solid #222', color: '#fff', padding: '12px', borderRadius: '10px' }} />
                </div>
                <input type="text" name="name" placeholder="NAME" required style={{ background: '#000', border: '1px solid #222', color: '#fff', padding: '12px', borderRadius: '10px' }} />
                <input type="tel" name="phone" placeholder="PHONE" required style={{ background: '#000', border: '1px solid #222', color: '#fff', padding: '12px', borderRadius: '10px' }} />
                <textarea name="address" placeholder="ADDRESS" required style={{ background: '#000', border: '1px solid #222', color: '#fff', padding: '12px', borderRadius: '10px', minHeight: '60px' }}></textarea>
                
                <div style={{ background: '#050505', padding: '15px', borderRadius: '15px', border: '1px solid #111' }}>
                  <select name="method" required onChange={(e)=>setPaymentMethod(e.target.value)} style={{ border: 'none', background: 'none', color: '#fff', width: '100%' }}>
                    <option value="" disabled selected>PAYMENT GATEWAY</option>
                    <option>Bkash</option><option>Nagad</option><option>Rocket</option>
                  </select>
                  {paymentMethod && <p style={{ fontSize: '10px', color: '#555', marginTop: '10px', textAlign: 'center' }}>SEND MONEY TO: {paymentNumbers[paymentMethod]}</p>}
                  <input type="text" name="txn_id" placeholder="TRANSACTION ID" required style={{ border: 'none', borderBottom: '1px solid #222', background: 'none', width: '100%', padding: '10px 0', marginTop: '10px', color: '#fff' }} />
                </div>
                
                <button type="submit" className="btn-order" style={{ padding: '20px' }}>CONFIRM ORDER</button>
                <button type="button" className="cancel-btn" onClick={()=>setIsModalOpen(false)}>Cancel</button>
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
