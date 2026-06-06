import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import fs from 'fs';
import path from 'path';

// কম্পোনেন্টগুলো ইমপোর্ট করা হলো (Absolute Path @ ব্যবহার করে)
import SiteHeader from '@/components/SiteHeader';
import SearchBar from '@/components/SearchBar';
import ProductList from '@/components/ProductList';
import ProductModal from '@/components/ProductModal';
import SiteFooter from '@/components/SiteFooter';

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

  const filteredProducts = searchQuery.trim() === '' ? [] : products.filter(p => 
    p.name.toLowerCase().replace(/-/g, ' ').includes(searchQuery.toLowerCase().replace(/-/g, ' '))
  );

  const closeModal = () => { setSelectedProduct(null); setModalType(null); setPaymentMethod(''); };

  return (
    <div style={{ backgroundColor: '#000', color: '#fff', minHeight: '100vh', fontFamily: 'Inter, sans-serif', overflowX: 'hidden' }}>
      <Head><title>NOMAD</title><meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1"/></Head>
      
      <SiteHeader header={siteContent.header} />
      
      <SearchBar announcement={announcement} searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

      <ProductList 
        categories={categories} viewCategory={viewCategory} setViewCategory={setViewCategory} 
        setSelectedProduct={setSelectedProduct} setModalType={setModalType} 
        searchQuery={searchQuery} filteredProducts={filteredProducts} 
      />

      <SiteFooter footer={siteContent.footer} />

      <ProductModal 
        selectedProduct={selectedProduct} modalType={modalType} setModalType={setModalType} 
        closeModal={closeModal} calculatePrice={calculatePrice} paymentNumbers={paymentNumbers} 
        paymentMethod={paymentMethod} setPaymentMethod={setPaymentMethod} 
      />
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
