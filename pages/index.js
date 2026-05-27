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
      const catName = p.name ? p.name.split(' ')[0] : 'PRODUCT';
      if (!catMap[catName]) catMap[catName] = [];
      catMap[catName].push(p);
    });
    setCategories(catMap);
  }, [allProducts]);

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

  const filteredProducts = searchQuery.trim() === '' ? [] : products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const closeModal = () => { setSelectedProduct(null); setModalType(null); setPaymentMethod(''); };

  return (
    <div style={{ backgroundColor: '#000', color: '#fff', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
      <Head><title>NOMAD | Premium</title></Head>
      <style>{`
        .btn-style { background: #111; color: #fff; border: 1px solid #333; padding: 10px; border-radius: 10px; cursor: pointer; margin-top: 5px; }
      `}</style>
      
      <header style={{ textAlign: 'center', padding: '40px' }}>
        <h1>NOMAD</h1>
        <p>{siteContent.header}</p>
      </header>

      <main style={{ padding: '20px' }}>
        <input type="text" placeholder="SEARCH..." onChange={(e)=>setSearchQuery(e.target.value)} style={{ width: '100%', padding: '10px', background: '#111', border: '1px solid #333', color: '#fff' }} />
        
        {Object.keys(categories).map(cat => (
          <div key={cat} style={{ marginTop: '20px' }}>
            <h2>{cat}</h2>
            {categories[cat].map((p, i) => (
              <div key={i} style={{ border: '1px solid #333', padding: '10px', marginBottom: '10px' }}>
                {p.image && <img src={`/products/${p.image}`} style={{ width: '100px' }} />}
                <h3>{p.name}</h3>
                <button className="btn-style" onClick={() => { setSelectedProduct(p); setModalType('details'); }}>DETAILS</button>
              </div>
            ))}
          </div>
        ))}
      </main>

      {selectedProduct && (
        <div style={{ position: 'fixed', inset: 0, background: '#000', padding: '20px', overflowY: 'auto' }}>
          <h2>{selectedProduct.name}</h2>
          <p>{selectedProduct.desc}</p>
          <button className="btn-style" onClick={closeModal}>CLOSE</button>
        </div>
      )}
    </div>
  );
}

export async function getStaticProps() {
  const dDir = path.join(process.cwd(), 'descriptions');
  const pDir = path.join(process.cwd(), 'public/products');
  const cDir = path.join(process.cwd(), 'content');

  const descFiles = fs.existsSync(dDir) ? fs.readdirSync(dDir).filter(f => f.endsWith('.txt')) : [];
  
  const allProducts = descFiles.map(file => {
    const handle = path.parse(file).name;
    const content = fs.readFileSync(path.join(dDir, file), 'utf8').trim().split('\n');
    
    // ছবি চেক করা (যদি ফোল্ডার এবং ফাইল থাকে)
    let image = null;
    if (fs.existsSync(pDir)) {
      const ext = ['jpg', 'jpeg', 'png', 'webp'].find(e => fs.existsSync(path.join(pDir, `${handle}.${e}`)));
      if (ext) image = `${handle}.${ext}`;
    }
    
    return { 
      id: handle, 
      name: content[0], 
      image: image, 
      desc: content.slice(1).join('\n'), 
      priceText: content.find(l => l.toLowerCase().includes('price')) || "1200 BDT" 
    };
  });

  const readTxt = (file, def) => {
    const p = path.join(cDir, file);
    return fs.existsSync(p) ? fs.readFileSync(p, 'utf8').trim() : def;
  };

  return { 
    props: { 
      allProducts, 
      siteContent: { header: readTxt('header.txt', 'Welcome'), footer: readTxt('footer.txt', '2026') }, 
      announcement: readTxt('announcement.txt', '') 
    }, 
    revalidate: 10 
  };
}
