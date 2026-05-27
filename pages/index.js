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
    return { original: numberOnly, base: basePrice, discountAmt: discountAmount, discountPercent: totalDiscountPercent, delivery: deliveryCharge, total: basePrice + deliveryCharge };
  };

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
      
      <main>
        {/* লুপের মধ্যে ছবি থাকলে দেখাবে, না থাকলে জায়গা খালি রাখবে না */}
        {Object.keys(categories).map(cat => (
          <section key={cat} style={{ marginBottom: '40px' }}>
            <div className="scroll-container">
              {categories[cat].map((p, i) => (
                <div key={i} className="cat-item">
                  {p.image && <img src={`/products/${p.image}`} style={{ width: '100%' }} />}
                  <div style={{ padding: '25px 20px', textAlign: 'center' }}>
                    <p style={{ fontSize: '16px', letterSpacing: '1px', marginBottom: '20px' }}>{p.name}</p>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button className="btn-style" onClick={() => { setSelectedProduct(p); setModalType('details'); }}>DETAILS</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </main>

      {(selectedProduct && modalType) && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.98)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#0a0a0a', width: '100%', maxWidth: '400px', padding: '40px 25px', borderRadius: '40px', border: '1px solid #1a1a1a', maxHeight: '95vh', overflowY: 'auto' }}>
            {modalType === 'details' ? (
              <div>
                {selectedProduct.image && <img src={`/products/${selectedProduct.image}`} style={{ width: '100%', borderRadius: '25px' }} />}
                <h2 style={{ textAlign: 'center', margin: '25px 0', fontSize: '20px' }}>{selectedProduct.name}</h2>
                <div style={{ marginBottom: '20px' }}>
                  {selectedProduct.desc.split('\n').map((line, i) => (
                    line.includes(':') ? (
                      <div key={i} className="desc-line"><span>{line.split(':')[0]}</span><span>:</span><span>{line.split(':')[1]}</span></div>
                    ) : <p key={i} style={{ fontSize: '12px', color: '#666', textAlign: 'center' }}>{line}</p>
                  ))}
                </div>
                <button className="btn-style" style={{ width: '100%', padding: '20px' }} onClick={()=>setModalType('order')}>ORDER</button>
              </div>
            ) : (
                // (অর্ডার ফর্মের বাকি অংশ আগের মতোই থাকবে...)
                <form action="/api/order" method="POST"> {/* ...আপনার আগের ফর্ম কোড... */}</form>
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
  
  const dFiles = fs.existsSync(dDir) ? fs.readdirSync(dDir).filter(f => f.endsWith('.txt')) : [];
  const allProducts = dFiles.map(file => {
    const handle = path.parse(file).name;
    const content = fs.readFileSync(path.join(dDir, file), 'utf8').trim().split('\n');
    
    // ছবি খোঁজা: থাকলে নাম, না থাকলে null
    const imageExtensions = ['jpg', 'jpeg', 'png', 'webp'];
    const foundImage = imageExtensions.find(ext => fs.existsSync(path.join(pDir, `${handle}.${ext}`)));
    
    return { 
      id: handle, 
      name: content[0], 
      image: foundImage ? `${handle}.${foundImage}` : null, 
      desc: content.slice(1).join('\n'), 
      priceText: content.find(l => l.toLowerCase().includes('price')) || "1200 BDT" 
    };
  });

  return { props: { allProducts, siteContent: { header: 'NOMAD', footer: '2026' }, announcement: '' }, revalidate: 10 };
}
