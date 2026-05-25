import React, { useState, useEffect } from 'react';
import fs from 'fs';
import path from 'path';

export default function Home({ allProducts, siteContent }) {
  const [products, setProducts] = useState([]);
  const [visibleCount, setVisibleCount] = useState(8);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  return (
    <div style={{ backgroundColor: '#000', color: '#fff', minHeight: '100vh', fontFamily: 'Inter, sans-serif', margin: 0 }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        .product-card { animation: fadeIn 0.9s ease-out forwards; }
        input, select, textarea { background: none; border: none; border-bottom: 1px solid #222; color: #fff; padding: 12px; outline: none; font-size: 13px; width: 100%; box-sizing: border-box; }
        input::placeholder { color: #444; letter-spacing: 1px; }
      `}</style>

      {/* Header */}
      <header style={{ textAlign: 'center', padding: '70px 20px', position: 'sticky', top: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(15px)', zIndex: 100 }}>
        <h1 style={{ letterSpacing: '15px', fontSize: '35px', margin: 0, fontWeight: '900' }}>NOMAD</h1>
        <p style={{ fontSize: '9px', color: '#666', marginTop: '12px', letterSpacing: '5px', textTransform: 'uppercase' }}>{siteContent.header}</p>
      </header>

      {/* Product List */}
      <main style={{ maxWidth: '450px', margin: '0 auto', padding: '20px' }}>
        {products.slice(0, visibleCount).map((product, index) => (
          <div key={index} className="product-card" style={{ marginBottom: '100px', opacity: 0 }}>
            <div style={{ backgroundColor: '#0a0a0a', borderRadius: '30px', overflow: 'hidden', boxShadow: '0 40px 80px rgba(0,0,0,0.6)' }}>
              <img src={`/products/${product.image}`} alt={product.name} style={{ width: '100%', display: 'block' }} />
            </div>
            
            <div style={{ textAlign: 'center', marginTop: '35px' }}>
              <h3 style={{ fontSize: '22px', letterSpacing: '3px', fontWeight: '500' }}>{product.name}</h3>
              <p style={{ fontSize: '13px', color: '#777', lineHeight: '1.8', margin: '18px 0', padding: '0 20px' }}>{product.desc}</p>
              
              <div style={{ display: 'flex', gap: '12px', padding: '0 10px' }}>
                <button 
                  onClick={() => { setSelectedProduct(product.name); setIsModalOpen(true); }}
                  style={{ flex: 3, backgroundColor: '#fff', color: '#000', border: 'none', padding: '20px', borderRadius: '15px', fontWeight: 'bold', letterSpacing: '2px', cursor: 'pointer', fontSize: '12px' }}
                >
                  ORDER NOW
                </button>
                <a 
                  href={`https://wa.me/8801521731371?text=Inquiry: ${product.name}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{ flex: 1, backgroundColor: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '15px', border: '1px solid #222' }}
                >
                  <svg width="22" height="22" fill="#fff" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.94 3.659 1.437 5.634 1.437h.005c6.558 0 11.897-5.335 11.9-11.894a11.83 11.83 0 00-3.415-8.411z"/></svg>
                </a>
              </div>
            </div>
          </div>
        ))}
      </main>

      {/* Footer & About */}
      <footer style={{ textAlign: 'center', padding: '100px 20px', borderTop: '1px solid #111', background: '#050505' }}>
        <div style={{ maxWidth: '350px', margin: '0 auto 50px auto', fontSize: '13px', color: '#555', lineHeight: '2', fontStyle: 'italic' }}>
          {siteContent.about}
        </div>
        <p style={{ letterSpacing: '6px', fontSize: '9px', color: '#222', textTransform: 'uppercase' }}>{siteContent.footer}</p>
      </footer>

      {/* Premium Order Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.98)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ backgroundColor: '#0a0a0a', width: '100%', maxWidth: '400px', padding: '45px 35px', borderRadius: '35px', border: '1px solid #1a1a1a', maxHeight: '90vh', overflowY: 'auto' }}>
            <button onClick={() => setIsModalOpen(false)} style={{ float: 'right', background: 'none', border: 'none', color: '#fff', fontSize: '30px', cursor: 'pointer', lineHeight: 0 }}>&times;</button>
            <h2 style={{ fontSize: '13px', textAlign: 'center', letterSpacing: '4px', marginBottom: '40px', color: '#fff', fontWeight: 'bold' }}>ORDER SPECIFICATIONS</h2>
            
            <form action="/api/order" method="POST" style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
              <input type="hidden" name="product" value={selectedProduct} />
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <select name="size" required style={{ background: 'none', border: 'none', borderBottom: '1px solid #222', color: '#fff' }}>
                  <option value="" disabled selected>SELECT SIZE</option>
                  <option value="M">MEDIUM (M)</option>
                  <option value="L">LARGE (L)</option>
                  <option value="XL">EXTRA LARGE (XL)</option>
                </select>
                <input type="text" name="color" placeholder="COLOR" required />
              </div>

              <input type="text" name="name" placeholder="FULL NAME" required />
              <input type="tel" name="phone" placeholder="PHONE NUMBER" required />
              <textarea name="address" placeholder="SHIPPING ADDRESS" required style={{ minHeight: '50px' }}></textarea>
              
              <div style={{ marginTop: '10px', padding: '15px', backgroundColor: '#050505', borderRadius: '15px', border: '1px solid #111' }}>
                <p style={{ fontSize: '10px', color: '#555', marginBottom: '15px', letterSpacing: '1px' }}>PAYMENT INFO (BKASH/NAGAD)</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <input type="text" name="payment_no" placeholder="SENDER NO" required />
                  <input type="text" name="txn_id" placeholder="TRANSACTION ID" required />
                </div>
              </div>

              <button type="submit" style={{ backgroundColor: '#fff', color: '#000', border: 'none', padding: '22px', borderRadius: '18px', fontWeight: '900', cursor: 'pointer', marginTop: '15px', letterSpacing: '3px', fontSize: '12px' }}>
                CONFIRM RESERVATION
              </button>
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

  const siteContent = {
    header: readTxt('header.txt', 'THE ONE. EVERYWHERE.'),
    about: readTxt('about.txt', 'Premium Clothing Brand based on expertise.'),
    footer: readTxt('footer.txt', 'NOMAD BY SH | 2026')
  };

  const images = fs.readdirSync(pDir).filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f));
  const allProducts = images.map(img => {
    const handle = path.parse(img).name;
    const dPath = path.join(dDir, `${handle}.txt`);
    return {
      name: handle.replace(/[-_]/g, ' ').toUpperCase(),
      image: img,
      desc: fs.existsSync(dPath) ? fs.readFileSync(dPath, 'utf8').trim() : "Premium Quality."
    };
  });

  return { props: { allProducts: JSON.parse(JSON.stringify(allProducts)), siteContent }, revalidate: 10 };
}
