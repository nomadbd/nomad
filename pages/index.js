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
  const [paymentMethod, setPaymentMethod] = useState('');
  const [viewCategory, setViewCategory] = useState(null);

  const paymentNumbers = {
    'Bkash': '01521731371', 'Nagad': '01521731371', 'Rocket': '01521731371', 'Upay': '01521731371', 'Cellfin': '01521731371'
  };

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
      if (target) { setSelectedProduct({ ...target, ref: router.query.ref || '' }); setModalType('details'); }
    }
  }, [allProducts, router.query]);

  const calculatePrice = (product) => {
    if (!product || !product.priceText) return { original: 0, base: 0, discountAmt: 0, discountPercent: 0, delivery: 0, total: 0 };
    
    const discMatch = announcement?.match(/(\d+)%/);
    const annDisc = discMatch ? parseInt(discMatch[1]) : 0;
    const numberOnly = parseInt(product.priceText.replace(/[^0-9]/g, "")) || 0;
    const descDiscMatch = product.desc?.match(/Discount:\s*(\d+)%/i);
    const descDisc = descDiscMatch ? parseInt(descDiscMatch[1]) : 0;
    
    const totalDiscountPercent = annDisc + descDisc;
    const discountAmount = Math.floor(numberOnly * totalDiscountPercent / 100);
    const basePrice = numberOnly - discountAmount;
    const delMatch = product.desc?.match(/Delivery:\s*(\d+)/i);
    const deliveryCharge = delMatch ? parseInt(delMatch[1]) : 0;
    
    return { 
      original: numberOnly,
      base: basePrice, 
      discountAmt: discountAmount,
      discountPercent: totalDiscountPercent,
      delivery: deliveryCharge, 
      total: basePrice + deliveryCharge 
    };
  };

  const filteredProducts = searchQuery.trim() === '' ? [] : products.filter(p => 
    p.name.toLowerCase().replace(/-/g, ' ').includes(searchQuery.toLowerCase().replace(/-/g, ' '))
  );

  const closeModal = () => { setSelectedProduct(null); setModalType(null); setPaymentMethod(''); };

  return (
    <div style={{ backgroundColor: '#000', color: '#fff', minHeight: '100vh', fontFamily: 'Inter, sans-serif', overflowX: 'hidden' }}>
      <Head><title>NOMAD | Premium</title><meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1"/></Head>
      <style>{`
        * { box-sizing: border-box; outline: none !important; }
        .scroll-container { display: flex; overflow-x: auto; gap: 20px; padding: 10px 20px; scrollbar-width: none; scroll-snap-type: x mandatory; }
        .scroll-container::-webkit-scrollbar { display: none; }
        .cat-item { min-width: 85vw; scroll-snap-align: center; background: #0a0a0a; border-radius: 40px; border: 1px solid #1a1a1a; overflow: hidden; margin: 0 auto; }
        .btn-style { flex: 1; background: #111; color: #fff; border: 1px solid #333; padding: 16px; border-radius: 15px; font-weight: bold; font-size: 11px; letter-spacing: 1px; cursor: pointer; text-align: center; }
        .input-field { background: #000; border: 1px solid #333; color: #fff; padding: 15px; border-radius: 15px; width: 100%; font-size: 14px; margin-bottom: 12px; }
        .desc-line { display: grid; grid-template-columns: 85px 15px 1fr; font-size: 12px; color: #777; margin-bottom: 5px; }
      `}</style>
      
      <header style={{ textAlign: 'center', padding: '40px 20px' }}>
        <h1 style={{ letterSpacing: '12px', fontSize: '24px', fontWeight: '900', margin: 0 }}>NOMAD</h1>
        <p style={{ fontSize: '7px', color: '#444', letterSpacing: '4px', marginTop: '8px' }}>{siteContent.header}</p>
      </header>
      
      <div style={{ maxWidth: '400px', margin: '0 auto 30px', padding: '0 20px' }}>
        <div style={{ background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: '25px', padding: '20px', textAlign: 'center' }}>
          {announcement && !searchQuery && <p style={{ fontSize: '10px', letterSpacing: '2px', color: '#fff', marginBottom: '15px' }}>{announcement}</p>}
          <input type="text" placeholder="SEARCH PRODUCT" onChange={(e)=>setSearchQuery(e.target.value)} style={{ background: 'none', border: 'none', color: '#fff', textAlign: 'center', width: '100%', fontSize: '11px', letterSpacing: '2px' }} />
        </div>
      </div>

      <main>
        {searchQuery ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', padding: '20px' }}>
            {filteredProducts.map((p, i) => (
              <div key={i} onClick={() => { setSelectedProduct(p); setModalType('details'); }} style={{ background: '#0a0a0a', padding: '10px', borderRadius: '20px', border: '1px solid #111' }}>
                <img src={`/products/${p.image}`} style={{ width: '100%', borderRadius: '15px' }} />
                <p style={{ fontSize: '10px', textAlign: 'center', marginTop: '10px' }}>{p.name}</p>
              </div>
            ))}
          </div>
        ) : viewCategory ? (
            <div style={{ padding: '0 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '20px 0' }}>
                <span style={{ fontSize: '12px', letterSpacing: '3px' }}>{viewCategory} COLLECTION</span>
                <span onClick={() => setViewCategory(null)} style={{ fontSize: '10px', color: '#444' }}>BACK</span>
                </div>
                {categories[viewCategory].map((p, i) => (
                <div key={i} style={{ marginBottom: '40px', background: '#0a0a0a', borderRadius: '40px', border: '1px solid #1a1a1a', overflow: 'hidden' }}>
                    <img src={`/products/${p.image}`} style={{ width: '100%' }} />
                    <h3 style={{ textAlign: 'center', fontSize: '18px', margin: '20px 0' }}>{p.name}</h3>
                    <div style={{ display: 'flex', gap: '10px', padding: '0 20px 20px' }}>
                    <button className="btn-style" onClick={() => { setSelectedProduct(p); setModalType('details'); }}>DETAILS</button>
                    <button className="btn-style" onClick={() => { setSelectedProduct(p); setModalType('order'); }}>ORDER</button>
                    </div>
                </div>
                ))}
            </div>
        ) : (
          Object.keys(categories).map(cat => (
            <section key={cat} style={{ marginBottom: '40px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 30px 15px' }}>
                <span style={{ fontSize: '12px', letterSpacing: '3px', color: '#666' }}>{cat}</span>
                <span onClick={() => setViewCategory(cat)} style={{ fontSize: '10px', color: '#fff', borderBottom: '1px solid #333' }}>SEE MORE</span>
              </div>
              <div className="scroll-container">
                {categories[cat].map((p, i) => (
                  <div key={i} className="cat-item">
                    <img src={`/products/${p.image}`} style={{ width: '100%' }} />
                    <div style={{ padding: '25px 20px', textAlign: 'center' }}>
                      <p style={{ fontSize: '16px', letterSpacing: '1px', marginBottom: '20px' }}>{p.name}</p>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button className="btn-style" onClick={() => { setSelectedProduct(p); setModalType('details'); }}>DETAILS</button>
                        <button className="btn-style" onClick={() => { setSelectedProduct(p); setModalType('order'); }}>ORDER</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))
        )}
      </main>

      <footer style={{ textAlign: 'center', padding: '60px 20px', background: '#050505', borderTop: '1px solid #111' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '25px', marginBottom: '30px' }}>
          <a href="https://facebook.com/nomadbysh" style={{ color: '#fff', textDecoration: 'none', fontSize: '10px' }}>FACEBOOK</a>
          <a href="mailto:contact@nomad.com" style={{ color: '#fff', textDecoration: 'none', fontSize: '10px' }}>EMAIL</a>
          <a href="https://wa.me/8801521731371" style={{ color: '#fff', textDecoration: 'none', fontSize: '10px' }}>WHATSAPP</a>
        </div>
        <p style={{ letterSpacing: '6px', fontSize: '8px', color: '#111' }}>{siteContent.footer}</p>
      </footer>

      {(selectedProduct && modalType) && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.98)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#0a0a0a', width: '100%', maxWidth: '400px', padding: '40px 25px', borderRadius: '40px', border: '1px solid #1a1a1a', maxHeight: '95vh', overflowY: 'auto' }}>
            {modalType === 'details' ? (
              <div>
                <img src={`/products/${selectedProduct.image}`} style={{ width: '100%', borderRadius: '25px' }} />
                <h2 style={{ textAlign: 'center', margin: '25px 0', fontSize: '20px' }}>{selectedProduct.name}</h2>
                <div style={{ marginBottom: '20px' }}>
                  {selectedProduct.desc.split('\n').map((line, i) => (
                    line.includes(':') ? (
                      <div key={i} className="desc-line"><span>{line.split(':')[0]}</span><span>:</span><span>{line.split(':')[1]}</span></div>
                    ) : <p key={i} style={{ fontSize: '12px', color: '#666', textAlign: 'center' }}>{line}</p>
                  ))}
                </div>
                <p style={{ textAlign: 'center', fontSize: '18px', fontWeight: 'bold' }}>৳{calculatePrice(selectedProduct).base}</p>
                <button className="btn-style" style={{ width: '100%', marginTop: '25px', padding: '20px' }} onClick={()=>setModalType('order')}>PROCEED TO ORDER</button>
                <p onClick={closeModal} style={{ textAlign: 'center', color: '#444', fontSize: '11px', marginTop: '20px', letterSpacing: '2px', cursor: 'pointer' }}>CANCEL</p>
              </div>
            ) : (
              <form action="/api/order" method="POST" style={{ display: 'flex', flexDirection: 'column' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '25px', fontSize: '16px', fontWeight: 'bold' }}>ORDER: {selectedProduct.name}</h2>
                <input type="hidden" name="product_id" value={selectedProduct.id} />
                <input type="hidden" name="product_name" value={selectedProduct.name} />
                <input type="hidden" name="price" value={calculatePrice(selectedProduct).base} />
                <input type="hidden" name="delivery" value={calculatePrice(selectedProduct).delivery} />
                <input type="hidden" name="total" value={calculatePrice(selectedProduct).total} />
                <input type="hidden" name="ref" value={selectedProduct.ref || ''} />
                {/* ডিসকাউন্ট ফিল্ডস */}
                <input type="hidden" name="discountAmt" value={calculatePrice(selectedProduct).discountAmt} />
                <input type="hidden" name="discountPercent" value={calculatePrice(selectedProduct).discountPercent} />

                <div style={{ background: '#111', padding: '15px', borderRadius: '15px', margin: '0 0 20px 0', textAlign: 'center' }}>
                    <p style={{ fontSize: '12px', color: '#aaa', textDecoration: 'line-through' }}>Original: ৳{calculatePrice(selectedProduct).original}</p>
                    <p style={{ fontSize: '13px', color: '#0f0' }}>Discount ({calculatePrice(selectedProduct).discountPercent}%): -৳{calculatePrice(selectedProduct).discountAmt}</p>
                    <p style={{ fontSize: '12px', color: '#aaa' }}>Delivery: ৳{calculatePrice(selectedProduct).delivery}</p>
                    <p style={{ fontWeight: 'bold', fontSize: '20px', color: '#fff', marginTop: '5px' }}>TOTAL: ৳{calculatePrice(selectedProduct).total}</p>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <select name="size" required className="input-field" style={{ flex: 1 }}><option value="" disabled selected>SIZE</option><option>M</option><option>L</option><option>XL</option><option>XXL</option></select>
                  <input type="text" name="color" placeholder="COLOR" required className="input-field" style={{ flex: 1 }} />
                </div>
                <input type="text" name="name" placeholder="FULL NAME" required className="input-field" />
                <input type="tel" name="phone" placeholder="PHONE" required className="input-field" />
                <textarea name="address" placeholder="ADDRESS" required className="input-field" style={{ minHeight: '80px' }}></textarea>
                
                <div style={{ background: '#050505', padding: '20px', borderRadius: '25px', border: '1px solid #1a1a1a', marginBottom: '25px' }}>
                  <select name="method" required className="input-field" style={{ border: 'none', marginBottom: '5px' }} onChange={(e)=>setPaymentMethod(e.target.value)}>
                    <option value="" disabled selected>PAYMENT GATEWAY</option>
                    <option>Bkash</option><option>Nagad</option><option>Rocket</option><option>Upay</option><option>Cellfin</option>
                  </select>
                  {paymentMethod && <p style={{ fontSize: '10px', color: '#666', textAlign: 'center', margin: '10px 0' }}>SEND MONEY TO: {paymentNumbers[paymentMethod]}</p>}
                  <input type="tel" name="sender_no" placeholder="SENDER NO" required style={{ background: 'none', border: 'none', borderBottom: '1px solid #333', color: '#fff', width: '100%', padding: '10px 0', fontSize: '14px', marginBottom: '10px' }} />
                  <input type="text" name="txn_id" placeholder="TRANSACTION ID" required style={{ background: 'none', border: 'none', borderBottom: '1px solid #333', color: '#fff', width: '100%', padding: '10px 0', fontSize: '14px' }} />
                </div>
                <button type="submit" className="btn-style" style={{ width: '100%', padding: '20px' }}>CONFIRM ORDER</button>
                <p onClick={closeModal} style={{ textAlign: 'center', color: '#444', fontSize: '11px', marginTop: '20px', letterSpacing: '2px', cursor: 'pointer' }}>CANCEL</p>
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
      name = content[0]; desc = content.slice(1).join('\n');
      const pLine = content.find(l => l.toLowerCase().includes('price'));
      priceText = pLine ? pLine.trim() : "1200 BDT";
    }
    return { id: handle, name, image: img, desc, priceText };
  });
  return { props: { allProducts, siteContent: { header: readTxt('header.txt', 'THE ONE. EVERYWHERE.'), footer: readTxt('footer.txt', 'NOMAD BY SH | 2026') }, announcement: readTxt('announcement.txt', '') }, revalidate: 10 };
}
