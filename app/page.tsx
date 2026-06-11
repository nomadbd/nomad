// Path: app/page.tsx
import fs from 'fs';
import path from 'path';
import ProductCard from '@/components/ProductCard';

export default function Home() {
  const productsDir = path.join(process.cwd(), 'data', 'products');
  const imagesDir = path.join(process.cwd(), 'public', 'images');

  // ১. এখন .json ফাইল খুঁজবে
  const files = fs.existsSync(productsDir) 
    ? fs.readdirSync(productsDir).filter(file => file.endsWith('.json')) 
    : [];

  const allImages = fs.existsSync(imagesDir) ? fs.readdirSync(imagesDir) : [];

  const products = files.map(file => {
      // ২. JSON ফাইল রিড করে পার্স করা হচ্ছে
      const content = fs.readFileSync(path.join(productsDir, file), 'utf-8');
      const data = JSON.parse(content);

      const baseName = path.parse(file).name;
      const matchedImage = allImages.find(img => path.parse(img).name === baseName);

      return {
        id: baseName,
        title: data.name,
        price: data.price,
        bio: data.bio,
        details: data.details, // এখানে এখন JSON Object যাচ্ছে
        image: matchedImage ? `/images/${matchedImage}` : null
      };
    });

  return (
    <main className="p-4 md:p-10 max-w-lg mx-auto">
      <h2 className="text-2xl font-light mb-8 text-white text-center">Nomad Feed</h2>

      {products.map((product) => (
        <ProductCard 
          key={product.id} 
          title={product.title}
          price={product.price}
          bio={product.bio}
          details={product.details} // এখানে JSON Object পাস করা হচ্ছে
          image={product.image}
        />
      ))}
    </main>
  );
}
