import React from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import fs from 'fs';
import path from 'path';

// কম্পোনেন্ট ও হুক ইমপোর্ট
import SiteHeader from '@/components/SiteHeader';
import SearchBar from '@/components/SearchBar';
import ProductList from '@/components/ProductList';
import ProductModal from '@/components/ProductModal';
import SiteFooter from '@/components/SiteFooter';

import { useProductData } from '@/hooks/useProductData';
import { usePriceCalculator } from '@/hooks/usePriceCalculator';
import { useSearchLogic } from '@/hooks/useSearchLogic';
import { useUIState } from '@/hooks/useUIState';

export default function Home({ allProducts, siteContent, announcement }) {
  const router = useRouter();

  // লজিক ও স্টেট ম্যানেজমেন্ট (কাস্টম হুক থেকে)
  const { products, categories, selectedProduct, setSelectedProduct, setModalType, modalType } = useProductData(allProducts, router.query);
  const { calculatePrice } = usePriceCalculator(announcement);
  const { searchQuery, setSearchQuery, filteredProducts } = useSearchLogic(products);
  const { paymentMethod, setPaymentMethod, viewCategory, setViewCategory, openDetails, openOrder, closeModal } = useUIState(setSelectedProduct, setModalType);

  const paymentNumbers = {
    'Bkash': '01521731371', 'Nagad': '01521731371', 'Rocket': '01521731371', 'Upay': '01521731371', 'Cellfin': '01521731371'
  };

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

// getStaticProps আগের মতোই থাকবে
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
