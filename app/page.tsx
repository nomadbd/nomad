// Path: app/page.tsx
import fs from 'fs';
import path from 'path';
import ProductList from '@/components/ProductList';

export default function Home() {
  const productsDir = path.join(process.cwd(), 'data', 'products');
  const files = fs.existsSync(productsDir) ? fs.readdirSync(productsDir) : [];

  const products = files.map(file => {
    const content = fs.readFileSync(path.join(productsDir, file), 'utf-8');
    const getVal = (key: string) => content.match(new RegExp(`${key}: (.*)`))?.[1] || '';
    
    return {
      id: file.replace('.txt', ''),
      title: getVal('Name'),
      price: getVal('Price'),
      bio: getVal('Bio'),
      fullDetails: content.split('Details:')[1]?.trim(),
      image: `/images/${file.replace('.txt', '.jpg')}`
    };
  });

  return (
    <main className="p-4 md:p-10 max-w-7xl mx-auto">
      <h2 className="text-2xl font-light mb-8 text-white">Latest Collection</h2>
      <ProductList initialProducts={products} />
    </main>
  );
}
