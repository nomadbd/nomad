// Path: app/page.tsx
import fs from 'fs';
import path from 'path';
import ProductList from '@/components/ProductList';

export default function Home() {
  const productsDir = path.join(process.cwd(), 'data', 'products');
  const imagesDir = path.join(process.cwd(), 'public', 'images');
  
  const files = fs.existsSync(productsDir) ? fs.readdirSync(productsDir) : [];
  const allImages = fs.existsSync(imagesDir) ? fs.readdirSync(imagesDir) : [];

  const products = files.map(file => {
    const content = fs.readFileSync(path.join(productsDir, file), 'utf-8');
    const getVal = (key: string) => content.match(new RegExp(`${key}: (.*)`))?.[1] || '';
    
    const baseName = file.replace('.txt', '');
    const matchedImage = allImages.find(img => path.parse(img).name === baseName);

    return {
      id: baseName,
      title: getVal('Name'),
      price: getVal('Price'),
      bio: getVal('Bio'),
      fullDetails: content.split('Details:')[1]?.trim(),
      image: matchedImage ? `/images/${matchedImage}` : null
    };
  });

  return (
    <main className="p-4 md:p-10 max-w-7xl mx-auto">
      <h2 className="text-2xl font-light mb-8 text-white">Latest Collection</h2>
      <ProductList initialProducts={products} />
    </main>
  );
}
