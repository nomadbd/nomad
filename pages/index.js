import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import fs from 'fs';
import path from 'path';

export default function Home({ allProducts, siteContent, announcement }) {
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(8);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');

  // পেমেন্ট নম্বর সেটআপ
  const paymentNumbers = {
    'Bkash': '01521731371',
    'Nagad': '01521731371',
    'Rocket': '01521731371',
    'Upay': '01521731371',
    'Cellfin': '01521731371'
  };

  useEffect(() => {
    const shuffled = [...allProducts].sort(() => 0.5 - Math.random());
    setProducts(shuffled);
  }, [allProducts]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 700) {
        setVisibleCount(prev => prev + 6);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
      `}</style>

      {/* Header */}
      <header style={{ textAlign: 'center', padding: '25px 20px', position: 'sticky', top: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(15px)', zIndex: 100, borderBottom: '1px solid #111' }}>
        <h1 style={{ letterSpacing: '15px', fontSize: '24px', margin: 0, fontWeight: '900' }}>NOMAD</h1>
        <p style={{ fontSize: '7px', color: '#555', marginTop: '5px', letterSpacing: '5px', textTransform: 'uppercase' }}>{siteContent.header}</p>
      </header>

      {/* Search & Announcement Card */}
      <div style={{ maxWidth: '410px', margin: '20px auto 10px auto', padding: '0 20px' }}>
        <div style={{ 
          backgroundColor: '#0a0a0a', 
          border: isFocused ? '1.5px solid #fff' : '1px solid #1a1a1a', 
          padding: '20px', borderRadius: '25px', textAlign: 'center',
          transition: 'all 0.4s' 
        }}>
          {announcement && !searchQuery && (
            <p style={{ fontSize: '11px', letterSpacing: '2px', color: '#fff', margin: '0 0 15px 0', textTransform: 'uppercase', fontWeight: 'bold' }}>
              {announcement}
            </p>
          )}
          <input type="text" className="search-input" placeholder="SEARCH PRODUCT" value={searchQuery} onFocus={() => setIsFocused(true)} onBlur={() => setIsFocused(false)} onChange={(e) => setSearchQuery(e.target.value)} style={{ textAlign: 'center', border: 'none', background: 'none', fontSize: '11px', letterSpacing: '3px', color: '#fff', width: '100%', outline: 'none' }} />
        </div>
      </div>

      {/* Product List */}
      <main style={{ maxWidth: '450px', margin: '0 auto', padding: '20px' }}>
        {filteredProducts.slice(0, visibleCount).map((product, index) => (
          <div key={index} className="product-card" style={{ marginBottom: '100px', opacity: 0 }}>
            <div style={{ backgroundColor: '#0a0a0a', borderRadius: '30px', overflow: 'hidden' }}>
              <img src={`/products/${product.image}`} alt={product.name} style={{ width: '100%', display: 'block' }} />
            </div>
            <div style={{ textAlign: 'center', marginTop: '35px' }}>
              <h3 style={{ fontSize: '20px', letterSpacing: '3px', fontWeight: '500' }}>{product.name}</h3>
              <p style={{ fontSize: '12px', color: '#777', lineHeight: '1.8', margin: '18px 0', padding: '0 20px' }}>{product.desc}</p>
              <button onClick={() => { setSelectedProduct(product.name); setIsModalOpen(true); }} style={{ width: '100%', backgroundColor: '#fff', color: '#000', border: 'none', padding: '18px 0', borderRadius: '15px', fontWeight: 'bold', letterSpacing: '2px', cursor: 'pointer', fontSize: '11px' }}>ORDER NOW</button>
            </div>
          </div>
        ))}
      </main>

      {/* Full Premium Order Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.98)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ backgroundColor: '#0a0a0a', width: '100%', maxWidth: '400px', padding: '45px 30px', borderRadius: '35px', border: '1px solid #1a1a1a', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', marginBottom: '35px' }}>
              <h2 style={{ fontSize: '11px', letterSpacing: '4px', fontWeight: 'bold', margin: 0 }}>SPECIFICATIONS</h2>
              <button onClick={() => { setIsModalOpen(false); setPaymentMethod(''); }} style={{ position: 'absolute', right: '-10px', background: 'none', border: 'none', color: '#fff', fontSize: '22px', cursor: 'pointer' }}>&times;</button>
            </div>
            <form action="/api/order" method="POST" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <input type="hidden" name="product" value={selectedProduct} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <select name="size" required><option value="" disabled selected>SIZE</option><option value="M">M</option><option value="L">L</option><option value="XL">XL</option></select>
                <input type="text" name="color" placeholder="COLOR" required />
              </div>
              <input type="text" name="name" placeholder="FULL NAME" required />
              <input type="tel" name="phone" placeholder="PHONE NUMBER" pattern="[0-9]*" required />
              <textarea name="address" placeholder="SHIPPING ADDRESS" required style={{ minHeight: '60px' }}></textarea>
              
              <div style={{ marginTop: '5px', padding: '18px', backgroundColor: '#050505', borderRadius: '20px', border: '1px solid #111' }}>
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

                <input type="tel" name="payment_no" placeholder="SENDER NO" pattern="[0-9]*" required style={{ marginBottom: '15px' }} />
                <input type="text" name="txn_id" placeholder="TRANSACTION ID" required />
              </div>
              <button type="submit" style={{ backgroundColor: '#fff', color: '#000', border: 'none', padding: '20px', borderRadius: '18px', fontWeight: '900', letterSpacing: '3px', fontSize: '11px' }}>RESERVE NOW</button>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer style={{ textAlign: 'center', padding: '80px 20px', borderTop: '1px solid #111', background: '#050505' }}>
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

  const announcement = readTxt('announcement.txt', '');
  const images = fs.readdirSync(pDir).filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f));
  
  const allProducts = images.map(img => {
    const handle = path.parse(img).name;
    const dPath = path.join(dDir, `${handle}.txt`);
    return {
      name: handle.replace(/[-_]/g, ' ').toUpperCase(),
      image: img,
      desc: fs.existsSync(dPath) ? fs.readFileSync(dPath, 'utf8').trim() : "Premium Selection"
    };
  });

  return { props: { allProducts: JSON.parse(JSON.stringify(allProducts)), siteContent, announcement }, revalidate: 10 };
}
