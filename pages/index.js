import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import fs from 'fs';
import path from 'path';

export default function Home({ allProducts, siteContent, announcement }) {
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState(''); // সার্চের জন্য
  const [visibleCount, setVisibleCount] = useState(8);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const shuffled = [...allProducts].sort(() => 0.5 - Math.random());
    setProducts(shuffled);
  }, [allProducts]);

  // সার্চ ফিল্টারিং লজিক
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ backgroundColor: '#000', color: '#fff', minHeight: '100vh', fontFamily: 'Inter, sans-serif', margin: 0 }}>
      <Head><title>NOMAD | Premium Clothing</title></Head>

      {/* Slim Header */}
      <header style={{ textAlign: 'center', padding: '25px 20px', position: 'sticky', top: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(15px)', zIndex: 100, borderBottom: '1px solid #111' }}>
        <h1 style={{ letterSpacing: '15px', fontSize: '24px', margin: 0, fontWeight: '900' }}>NOMAD</h1>
        <p style={{ fontSize: '7px', color: '#555', marginTop: '5px', letterSpacing: '5px', textTransform: 'uppercase' }}>{siteContent.header}</p>
      </header>

      {/* Dynamic Search & Announcement Card */}
      <div style={{ maxWidth: '410px', margin: '20px auto 10px auto', padding: '0 20px' }}>
        <div style={{ backgroundColor: '#0a0a0a', border: '1px solid #1a1a1a', padding: '12px 20px', borderRadius: '25px', textAlign: 'center' }}>
          {announcement && !searchQuery ? (
            <p style={{ fontSize: '10px', letterSpacing: '2px', color: '#fff', margin: '0 0 10px 0', textTransform: 'uppercase' }}>{announcement}</p>
          ) : null}
          
          {/* Search Input Box */}
          <input 
            type="text" 
            placeholder="SEARCH PRODUCT (e.g. 1)" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ textAlign: 'center', border: 'none', borderBottom: 'none', padding: '5px', fontSize: '11px', letterSpacing: '2px', color: '#fff' }} 
          />
        </div>
      </div>

      {/* Product List */}
      <main style={{ maxWidth: '450px', margin: '0 auto', padding: '20px' }}>
        {filteredProducts.slice(0, visibleCount).map((product, index) => (
          <div key={index} style={{ marginBottom: '100px' }}>
            <div style={{ backgroundColor: '#0a0a0a', borderRadius: '30px', overflow: 'hidden' }}>
              <img src={`/products/${product.image}`} alt={product.name} style={{ width: '100%' }} />
            </div>
            <div style={{ textAlign: 'center', marginTop: '35px' }}>
              <h3 style={{ fontSize: '20px', letterSpacing: '3px' }}>{product.name}</h3>
              <p style={{ fontSize: '12px', color: '#777' }}>{product.desc}</p>
              <button onClick={() => { setSelectedProduct(product.name); setIsModalOpen(true); }} style={{ backgroundColor: '#fff', color: '#000', border: '1px solid #fff', padding: '18px 40px', borderRadius: '15px', fontWeight: 'bold', fontSize: '11px', cursor: 'pointer' }}>ORDER NOW</button>
            </div>
          </div>
        ))}
      </main>
      
      {/* ... (বাকি ফুটার এবং মোডাল কোড আগের মতোই থাকবে) */}
    </div>
  );
}

export async function getStaticProps() {
  // (StaticProps কোড আগের মতোই থাকবে)
}
