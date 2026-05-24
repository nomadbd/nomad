import React, { useState } from 'react';
import fs from 'fs';
import path from 'path';

export default function Home({ products }) {
  const [selectedProduct, setSelectedProduct] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openOrderForm = (productName) => {
    setSelectedProduct(productName);
    setIsModalOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div style={{ backgroundColor: '#000', color: '#fff', minHeight: '100vh', fontFamily: 'sans-serif', margin: 0, padding: 0 }}>
      
      {/* Header */}
      <header style={{ textAlign: 'center', padding: '50px 20px', borderBottom: '1px solid #111' }}>
        <h1 style={{ letterSpacing: '10px', fontSize: '32px', margin: 0, fontWeight: '900' }}>NOMAD</h1>
        <p style={{ fontSize: '10px', color: '#666', marginTop: '12px', letterSpacing: '3px', textTransform: 'uppercase' }}>The one. Everywhere.</p>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: '450px', margin: '0 auto', padding: '40px 20px' }}>
        {(!products || products.length === 0) ? (
          <p style={{ textAlign: 'center', color: '#444', marginTop: '100px' }}>Collections Not Available</p>
        ) : (
          products.map((product, index) => (
            <div key={index} style={{ marginBottom: '80px', textAlign: 'center' }}>
              
              {/* Image Container */}
              <div style={{ backgroundColor: '#0a0a0a', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
                <img src={`/products/${product.image}`} alt={product.cleanName} style={{ width: '100%', display: 'block' }} />
              </div>

              {/* Product Info */}
              <div style={{ marginTop: '30px' }}>
                <h3 style={{ fontSize: '20px', letterSpacing: '3px', marginBottom: '15px', textTransform: 'uppercase' }}>{product.cleanName}</h3>
                <p style={{ fontSize: '13px', color: '#999', lineHeight: '1.8', marginBottom: '30px', fontStyle: 'italic', padding: '0 10px' }}>
                  {product.description}
                </p>
                
                {/* Order Button - Fixed below description */}
                <button 
                  onClick={() => openOrderForm(product.cleanName)}
                  style={{
                    backgroundColor: '#fff',
                    color: '#000',
                    border: 'none',
                    padding: '18px 0',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    borderRadius: '12px',
                    letterSpacing: '4px',
                    width: '100%',
                    cursor: 'pointer',
                    boxShadow: '0 10px 20px rgba(255,255,255,0.05)'
                  }}
                >
                  ORDER NOW
                </button>
              </div>
            </div>
          ))
        )}
      </main>

      {/* Footer */}
      <footer style={{ textAlign: 'center', padding: '60px 20px', borderTop: '1px solid #111', backgroundColor: '#050505' }}>
        <p style={{ fontSize: '10px', letterSpacing: '5px', color: '#444', textTransform: 'uppercase' }}>Nomad by SH</p>
        <p style={{ fontSize: '8px', color: '#222', marginTop: '15px' }}>&copy; {new Date().getFullYear()} ALL RIGHTS RESERVED.</p>
      </footer>

      {/* Modal - Fixed and Centered */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.98)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ backgroundColor: '#0a0a0a', width: '100%', maxWidth: '380px', padding: '40px 30px', borderRadius: '25px', border: '1px solid #222', position: 'relative' }}>
            <button onClick={() => setIsModalOpen(false)} style={{ position: 'absolute', top: '20px', right: '25px', background: 'none', border: 'none', color: '#fff', fontSize: '30px', cursor: 'pointer' }}>&times;</button>
            
            <h2 style={{ fontSize: '14px', textAlign: 'center', letterSpacing: '4px', marginBottom: '40px', color: '#fff' }}>ORDER DETAILS</h2>
            
            <form action="/api/order" method="POST" style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
              <input type="hidden" name="product" value={selectedProduct} />
              
              <input type="text" name="name" placeholder="YOUR FULL NAME" required style={{ background: 'none', border: 'none', borderBottom: '1px solid #222', padding: '12px 5px', color: '#fff', fontSize: '12px', outline: 'none', letterSpacing: '1px' }} />
              
              <input type="tel" name="phone" placeholder="PHONE NUMBER" required style={{ background: 'none', border: 'none', borderBottom: '1px solid #222', padding: '12px 5px', color: '#fff', fontSize: '12px', outline: 'none', letterSpacing: '1px' }} />
              
              <input type="text" name="address" placeholder="DELIVERY ADDRESS" required style={{ background: 'none', border: 'none', borderBottom: '1px solid #222', padding: '12px 5px', color: '#fff', fontSize: '12px', outline: 'none', letterSpacing: '1px' }} />
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <input type="text" name="bkashNumber" placeholder="BKASH NO" required style={{ background: 'none', border: 'none', borderBottom: '1px solid #222', padding: '12px 5px', color: '#fff', fontSize: '12px', outline: 'none', letterSpacing: '1px' }} />
                <input type="text" name="txid" placeholder="TRX ID" required style={{ background: 'none', border: 'none', borderBottom: '1px solid #222', padding: '12px 5px', color: '#fff', fontSize: '12px', outline: 'none', letterSpacing: '1px' }} />
              </div>
              
              <button type="submit" style={{ backgroundColor: '#fff', color: '#000', border: 'none', padding: '20px', marginTop: '20px', borderRadius: '12px', fontWeight: 'bold', fontSize: '12px', letterSpacing: '3px', cursor: 'pointer' }}>
                CONFIRM ORDER
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export async function getStaticProps() {
  try {
    const productsDir = path.join(process.cwd(), 'public/products');
    const descDir = path.join(process.cwd(), 'descriptions');
    let imageFiles = fs.readdirSync(productsDir).filter(file => /\.(jpg|jpeg|png|webp)$/i.test(file));

    const products = imageFiles.map((filename) => {
      const handle = path.parse(filename).name;
      const descPath = path.join(descDir, `${handle}.txt`);
      let description = "Premium quality merchandise.";
      if (fs.existsSync(descPath)) {
        const content = fs.readFileSync(descPath, 'utf8').trim();
        const lines = content.split('\n');
        description = lines.length >= 3 ? lines.slice(2).join(' ') : content;
      }
      return { cleanName: handle.replace(/[-_]/g, ' '), image: filename, description: description };
    });

    return { props: { products: JSON.parse(JSON.stringify(products)) }, revalidate: 10 };
  } catch (error) {
    return { props: { products: [] } };
  }
}
