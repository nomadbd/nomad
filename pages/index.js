import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import fs from 'fs';
import path from 'path';

export default function Home({ allProducts, siteContent, announcement }) {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(8);
  const [selectedProduct, setSelectedProduct] = useState({ id: '', name: '' });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');

  const paymentNumbers = {
    'Bkash': '01521731371',
    'Nagad': '01521731371',
    'Rocket': '01521731371',
    'Upay': '01521731371',
    'Cellfin': '01521731371'
  };

  useEffect(() => {
    setProducts(allProducts);
    
    // অটোমেটিক প্রডাক্ট লিংক হ্যান্ডেলার (URL: ?product=ID)
    if (router.query.product) {
      const target = allProducts.find(p => p.id === router.query.product);
      if (target) {
        setSelectedProduct({ id: target.id, name: target.name });
        setIsModalOpen(true);
      }
    }
  }, [allProducts, router.query]);

  // উন্নত সার্চ লজিক (মিল থাকা প্রডাক্টগুলো আগে দেখাবে)
  const filteredProducts = searchQuery.trim() === '' 
    ? products 
    : products
        .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
        .sort((a, b) => {
          const aIndex = a.name.toLowerCase().indexOf(searchQuery.toLowerCase());
          const bIndex = b.name.toLowerCase().indexOf(searchQuery.toLowerCase());
          return aIndex - bIndex;
        });

  return (
    <div style={{ backgroundColor: '#000', color: '#fff', minHeight: '100vh', fontFamily: 'Inter, sans-serif', margin: 0 }}>
      
      <Head>
        <title>NOMAD | Premium Clothing Brand</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <style>{`
        @keyframes luxuryFade { 0% { opacity: 0; transform: translateY(20px); } 100% { opacity: 1; transform: translateY(0); } }
        .product-card { animation: luxuryFade 1.2s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
        input, select, textarea { background: none; border: none; border-bottom: 1px solid #222; color: #fff; padding: 12px; outline: none; font-size: 13px; width: 100%; box-sizing: border-box; }
        input:focus, select:focus, textarea:focus { border-bottom-color: #fff; }
        .search-input::placeholder { color: #444; letter-spacing: 2px; text-transform: uppercase; font-size: 10px; }
        option { background-color: #000; color: #fff; }
        
        /* ডেসক্রিপশন গ্রিড লেআউট */
        .desc-container { display: flex; flex-direction: column; gap: 6px; padding: 0 20px; margin: 18px 0; }
        .desc-line { display: grid; grid-template-columns: 85px 15px 1fr; font-size: 12px; color: #777; text-align: left; }
        .desc-para { white-space: pre-line; font-size: 12px; color: #777; line-height: 1.8; margin-top: 15px; text-align: center; }
      `}</style>

      {/* Header */}
      <header style={{ textAlign: 'center', padding: '25px 20px', position: 'sticky', top: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(15px)', zIndex: 100, borderBottom: '1px solid #111' }}>
        <h1 style={{ letterSpacing: '15px', fontSize: '24px', margin: 0, fontWeight: '900' }}>NOMAD</h1>
        <p style={{ fontSize: '7px', color: '#555', marginTop: '5px', letterSpacing: '5px', textTransform: 'uppercase' }}>{siteContent.header}</p>
      </header>

      {/* Search & Announcement */}
      <div style={{ maxWidth: '410px', margin: '20px auto 10px auto', padding: '0 20px' }}>
        <div style={{ 
          backgroundColor: '#0a0a0a', 
          border: isFocused ? '1.5px solid #fff' : '1px solid #1a1a1a', 
          padding: '20px', borderRadius: '25px', textAlign: 'center', transition: 'all 0.4s' 
        }}>
          {announcement && !searchQuery && (
            <p style={{ fontSize: '11px', letterSpacing: '2px', color: '#fff', margin: '0 0 15px 0', textTransform: 'uppercase', fontWeight: 'bold' }}>
              {announcement}
            </p>
          )}
          <input 
            type="text" 
            className="search-input" 
            placeholder="SEARCH PRODUCT" 
            value={searchQuery} 
            onFocus={() => setIsFocused(true)} 
            onBlur={() => setIsFocused(false)} 
            onChange={(e) => setSearchQuery(e.target.value)} 
            style={{ textAlign: 'center', border: 'none', background: 'none', fontSize: '11px', letterSpacing: '3px', color: '#fff', width: '100%', outline: 'none' }} 
          />
        </div>
      </div>

      {/* Product List */}
      <main style={{ maxWidth: '450px', margin: '0 auto', padding: '20px' }}>
        {filteredProducts.length > 0 ? (
          filteredProducts.slice(0, visibleCount).map((product, index) => (
            <div key={index} className="product-card" style={{ marginBottom: '100px', opacity: 0 }}>
              <div style={{ backgroundColor: '#0a0a0a', borderRadius: '30px', overflow: 'hidden' }}>
                <img src={`/products/${product.image}`} alt={product.name} style={{ width: '100%', display: 'block' }} />
              </div>
              <div style={{ textAlign: 'center', marginTop: '35px' }}>
                <h3 style={{ fontSize: '20px', letterSpacing: '3px', fontWeight: '500' }}>{product.name}</h3>
                
                {/* স্মার্ট ডেসক্রিপশন রেন্ডারিং */}
                <div className="desc-container">
                  {product.desc.split('\n').map((line, i) => {
                    if (line.includes(':')) {
                      const [label, value] = line.split(':');
                      return (
                        <div key={i} className="desc-line">
                          <span>{label.trim()}</span>
                          <span>:</span>
                          <span>{value.trim()}</span>
                        </div>
                      );
                    }
                    return line.trim() !== "" ? <p key={i} className="desc-para">{line}</p> : null;
                  })}
                </div>

                <button 
                  onClick={() => { setSelectedProduct({ id: product.id, name: product.name }); setIsModalOpen(true); }} 
                  style={{ width: '100%', backgroundColor: '#fff', color: '#000', border: 'none', padding: '18px 0', borderRadius: '15px', fontWeight: 'bold', letterSpacing: '2px', cursor: 'pointer', fontSize: '11px' }}
                >
                  ORDER NOW
                </button>
              </div>
            </div>
          ))
        ) : (
          searchQuery && <p style={{ textAlign: 'center', color: '#333', marginTop: '50px', letterSpacing: '2px', fontSize: '10px' }}>NO MATCHES FOUND</p>
        )}
      </main>

      {/* Order Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.98)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ backgroundColor: '#0a0a0a', width: '100%', maxWidth: '400px', padding: '45px 30px', borderRadius: '35px', border: '1px solid #1a1a1a', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>
            
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
              <h2 style={{ fontSize: '11px', letterSpacing: '4px', fontWeight: 'bold', margin: 0, textTransform: 'uppercase' }}>{selectedProduct.name}</h2>
              <button 
                onClick={() => { setIsModalOpen(false); setPaymentMethod(''); }} 
                style={{ position: 'absolute', top: '20px', right: '30px', background: 'none', border: 'none', color: '#fff', fontSize: '22px', cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>

            <form action="/api/order" method="POST" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <input type="hidden" name="product_id" value={selectedProduct.id} />
              <input type="hidden" name="product_name" value={selectedProduct.name} />
              
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

              <button type="submit" style={{ backgroundColor: '#fff', color: '#000', border: 'none', padding: '20px', borderRadius: '18px', fontWeight: '900', letterSpacing: '3px', fontSize: '11px' }}>RESERVE NOW</button>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
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

  const siteContent = {
    header: readTxt('header.txt', 'THE ONE. EVERYWHERE.'),
    about: readTxt('about.txt', 'Nomad defines the intersection of luxury and utility.'),
    footer: readTxt('footer.txt', 'NOMAD BY SH | 2026')
  };

  const images = fs.readdirSync(pDir).filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f));
  const allProducts = images.map(img => {
    const handle = path.parse(img).name;
    const dPath = path.join(dDir, `${handle}.txt`);
    let name = handle.toUpperCase();
    let desc = "Premium Selection";

    if (fs.existsSync(dPath)) {
      const content = fs.readFileSync(dPath, 'utf8').trim().split('\n');
      name = content[0];
      desc = content.slice(1).join('\n');
    }

    return { id: handle, name: name.toUpperCase(), image: img, desc: desc };
  });

  return { 
    props: { 
      allProducts: JSON.parse(JSON.stringify(allProducts)), 
      siteContent, 
      announcement: readTxt('announcement.txt', '') 
    }, 
    revalidate: 10 
  };
}
