import React, { useState, useEffect } from 'react';
import fs from 'fs';
import path from 'path';

export default function Home({ allProducts, siteContent }) {
  const [products, setProducts] = useState([]);
  const [visibleCount, setVisibleCount] = useState(6);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // র‍্যান্ডম প্রডাক্ট সেটআপ
  useEffect(() => {
    const shuffled = [...allProducts].sort(() => 0.5 - Math.random());
    setProducts(shuffled);
  }, [allProducts]);

  // ইনফিনিট স্ক্রল
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500) {
        setVisibleCount(prev => prev + 4);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div style={{ backgroundColor: '#000', color: '#fff', minHeight: '100vh', fontFamily: 'sans-serif', margin: 0 }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .product-card { animation: fadeIn 0.8s ease forwards; }
      `}</style>

      {/* Header */}
      <header style={{ textAlign: 'center', padding: '60px 20px', position: 'sticky', top: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', zIndex: 50 }}>
        <h1 style={{ letterSpacing: '12px', fontSize: '32px', margin: 0, fontWeight: '900' }}>NOMAD</h1>
        <p style={{ fontSize: '10px', color: '#666', marginTop: '10px', letterSpacing: '4px' }}>{siteContent.header}</p>
      </header>

      {/* Product List */}
      <main style={{ maxWidth: '450px', margin: '0 auto', padding: '20px' }}>
        {products.slice(0, visibleCount).map((product, index) => (
          <div key={index} className="product-card" style={{ marginBottom: '80px', opacity: 0 }}>
            <div style={{ backgroundColor: '#0a0a0a', borderRadius: '24px', overflow: 'hidden' }}>
              <img src={`/products/${product.image}`} alt={product.name} style={{ width: '100%', display: 'block' }} />
            </div>
            <div style={{ textAlign: 'center', marginTop: '30px' }}>
              <h3 style={{ fontSize: '20px', letterSpacing: '2px' }}>{product.name}</h3>
              <p style={{ fontSize: '12px', color: '#888', lineHeight: '1.6', margin: '15px 0' }}>{product.desc}</p>
              
              <div style={{ display: 'flex', gap: '10px', padding: '0 10px' }}>
                <button 
                  onClick={() => { setSelectedProduct(product.name); setIsModalOpen(true); }}
                  style={{ flex: 2, backgroundColor: '#fff', color: '#000', border: 'none', padding: '15px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  ORDER NOW
                </button>
                <a 
                  href={`https://wa.me/8801521731371?text=Hi, I'm interested in ${product.name}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{ flex: 1, backgroundColor: '#25D366', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px', textDecoration: 'none' }}
                >
                  WhatsApp
                </a>
              </div>
            </div>
          </div>
        ))}
      </main>

      {/* Footer & About */}
      <footer style={{ textAlign: 'center', padding: '80px 20px', borderTop: '1px solid #111', background: '#050505' }}>
        <div style={{ maxWidth: '400px', margin: '0 auto 40px auto', fontSize: '13px', color: '#666', lineHeight: '1.8' }}>
          {siteContent.about}
        </div>
        <p style={{ letterSpacing: '5px', fontSize: '10px', color: '#333' }}>{siteContent.footer}</p>
      </footer>

      {/* Order Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.98)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ backgroundColor: '#0a0a0a', width: '100%', maxWidth: '380px', padding: '40px', borderRadius: '30px', border: '1px solid #222' }}>
            <button onClick={() => setIsModalOpen(false)} style={{ float: 'right', background: 'none', border: 'none', color: '#fff', fontSize: '25px', cursor: 'pointer' }}>&times;</button>
            <h2 style={{ fontSize: '12px', textAlign: 'center', letterSpacing: '3px', marginBottom: '30px' }}>CONFIRM ORDER</h2>
            <form action="/api/order" method="POST" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <input type="hidden" name="product" value={selectedProduct} />
              <input type="text" name="name" placeholder="YOUR NAME" required style={{ background: 'none', border: 'none', borderBottom: '1px solid #222', padding: '10px', color: '#fff', outline: 'none' }} />
              <input type="tel" name="phone" placeholder="PHONE" required style={{ background: 'none', border: 'none', borderBottom: '1px solid #222', padding: '10px', color: '#fff', outline: 'none' }} />
              <textarea name="address" placeholder="DELIVERY ADDRESS" required style={{ background: 'none', border: 'none', borderBottom: '1px solid #222', padding: '10px', color: '#fff', outline: 'none', minHeight: '60px' }}></textarea>
              <button type="submit" style={{ backgroundColor: '#fff', color: '#000', border: 'none', padding: '18px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' }}>PLACE ORDER</button>
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

  // কন্টেন্ট লোড করার ফাংশন
  const readTxt = (file, def) => fs.existsSync(path.join(cDir, file)) ? fs.readFileSync(path.join(cDir, file), 'utf8').trim() : def;

  const siteContent = {
    header: readTxt('header.txt', 'THE ONE. EVERYWHERE.'),
    about: readTxt('about.txt', 'Premium Clothing Brand.'),
    footer: readTxt('footer.txt', 'NOMAD BY SH')
  };

  const images = fs.readdirSync(pDir).filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f));
  const allProducts = images.map(img => {
    const handle = path.parse(img).name;
    const dPath = path.join(dDir, `${handle}.txt`);
    return {
      name: handle.replace(/[-_]/g, ' '),
      image: img,
      desc: fs.existsSync(dPath) ? fs.readFileSync(dPath, 'utf8').trim() : "Premium Quality Merchandise."
    };
  });

  return { props: { allProducts: JSON.parse(JSON.stringify(allProducts)), siteContent }, revalidate: 10 };
}
