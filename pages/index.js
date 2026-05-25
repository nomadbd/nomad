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
        <title>NOMAD | Premium Clothing</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <style>{`
        @keyframes luxuryFade { 0% { opacity: 0; transform: translateY(20px); } 100% { opacity: 1; transform: translateY(0); } }
        .product-card { animation: luxuryFade 1.2s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
        input, select, textarea { background: none; border: none; border-bottom: 1px solid #1a1a1a; color: #fff; padding: 15px 5px; outline: none; font-size: 12px; width: 100%; box-sizing: border-box; transition: border-color 0.3s; }
        input:focus, select:focus, textarea:focus { border-bottom-color: #fff; }
        input::placeholder { color: #333; letter-spacing: 2px; text-transform: uppercase; font-size: 10px; }
        .order-modal { animation: luxuryFade 0.6s ease-out; }
      `}</style>

      {/* Header */}
      <header style={{ textAlign: 'center', padding: '25px 20px', position: 'sticky', top: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(15px)', zIndex: 100 }}>
        <h1 style={{ letterSpacing: '15px', fontSize: '24px', margin: 0, fontWeight: '900' }}>NOMAD</h1>
        <p style={{ fontSize: '7px', color: '#444', marginTop: '5px', letterSpacing: '5px' }}>{siteContent.header}</p>
      </header>

      {/* Search & Announcement Card */}
      <div style={{ maxWidth: '410px', margin: '20px auto', padding: '0 20px' }}>
        <div style={{ backgroundColor: '#0a0a0a', border: isFocused ? '1px solid #fff' : '1px solid #111', padding: '20px', borderRadius: '25px', transition: 'all 0.4s' }}>
          {announcement && !searchQuery && <p style={{ fontSize: '11px', letterSpacing: '2px', textAlign: 'center', fontWeight: 'bold', marginBottom: '15px' }}>{announcement}</p>}
          <input type="text" placeholder="SEARCH PRODUCT" value={searchQuery} onFocus={() => setIsFocused(true)} onBlur={() => setIsFocused(false)} onChange={(e) => setSearchQuery(e.target.value)} style={{ textAlign: 'center', border: 'none', letterSpacing: '3px' }} />
        </div>
      </div>

      {/* Product Grid */}
      <main style={{ maxWidth: '450px', margin: '0 auto', padding: '20px' }}>
        {filteredProducts.slice(0, visibleCount).map((product, index) => (
          <div key={index} className="product-card" style={{ marginBottom: '80px', opacity: 0 }}>
            <div style={{ borderRadius: '30px', overflow: 'hidden', background: '#0a0a0a' }}>
              <img src={`/products/${product.image}`} alt={product.name} style={{ width: '100%', display: 'block' }} />
            </div>
            <div style={{ textAlign: 'center', marginTop: '30px' }}>
              <h3 style={{ fontSize: '18px', letterSpacing: '3px' }}>{product.name}</h3>
              <p style={{ fontSize: '11px', color: '#666', margin: '15px 0' }}>{product.desc}</p>
              <button onClick={() => { setSelectedProduct(product.name); setIsModalOpen(true); }} style={{ backgroundColor: '#fff', color: '#000', padding: '18px 40px', borderRadius: '12px', fontWeight: 'bold', fontSize: '11px', border: 'none', cursor: 'pointer', letterSpacing: '2px' }}>ORDER NOW</button>
            </div>
          </div>
        ))}
      </main>

      {/* PREMIUM MINIMAL ORDER FORM */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.95)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(10px)' }}>
          <div className="order-modal" style={{ width: '100%', maxWidth: '380px', position: 'relative' }}>
            
            <button onClick={() => setIsModalOpen(false)} style={{ position: 'absolute', top: '-40px', right: '0', background: 'none', border: 'none', color: '#fff', fontSize: '30px', cursor: 'pointer' }}>&times;</button>
            
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
              <h2 style={{ fontSize: '10px', letterSpacing: '5px', color: '#555' }}>RESERVE ITEM</h2>
              <p style={{ fontSize: '16px', letterSpacing: '2px', marginTop: '10px' }}>{selectedProduct}</p>
            </div>

            <form action="/api/order" method="POST" style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
              <input type="hidden" name="product" value={selectedProduct} />
              
              <div style={{ display: 'flex', gap: '20px' }}>
                <select name="size" required><option value="" disabled selected>SIZE</option><option value="M">M</option><option value="L">L</option><option value="XL">XL</option></select>
                <input type="text" name="color" placeholder="COLOR" required />
              </div>

              <input type="text" name="name" placeholder="FULL NAME" required />
              <input type="tel" name="phone" placeholder="PHONE" required />
              <textarea name="address" placeholder="SHIPPING ADDRESS" required rows="2"></textarea>

              <div style={{ marginTop: '10px' }}>
                <select name="method" required style={{ marginBottom: '20px' }}>
                  <option value="" disabled selected>PAYMENT METHOD</option>
                  <option value="Bkash">BKASH</option><option value="Nagad">NAGAD</option>
                </select>
                <input type="text" name="txn_id" placeholder="TRANSACTION ID" required />
              </div>

              <button type="submit" style={{ backgroundColor: '#fff', color: '#000', padding: '20px', borderRadius: '15px', fontWeight: '900', letterSpacing: '4px', fontSize: '12px', border: 'none', marginTop: '20px' }}>CONFIRM RESERVATION</button>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer style={{ textAlign: 'center', padding: '60px 20px', borderTop: '1px solid #111' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '30px', marginBottom: '30px' }}>
          <a href="https://facebook.com/nomadbysh" target="_blank" rel="noopener noreferrer" style={{ color: '#fff', textDecoration: 'none', fontSize: '10px', letterSpacing: '2px' }}>FB</a>
          <a href="mailto:nomadbysh@gmail.com" style={{ color: '#fff', textDecoration: 'none', fontSize: '10px', letterSpacing: '2px' }}>MAIL</a>
          <a href="https://wa.me/8801521731371" style={{ color: '#fff', textDecoration: 'none', fontSize: '10px', letterSpacing: '2px' }}>WA</a>
        </div>
        <p style={{ letterSpacing: '5px', fontSize: '8px', color: '#222' }}>NOMAD BY SH | 2026</p>
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

  const siteContent = { header: readTxt('header.txt', 'THE ONE. EVERYWHERE.'), about: readTxt('about.txt', '') };
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
