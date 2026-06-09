import ProductGrid from '@/components/product/ProductGrid';
import { getProductsByCategory } from '@/lib/products';

const categories = ['tshirt', 'shirt', 'pant', 'katuwa', 'shoe', 'watch', 'perfume'];

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {categories.map(cat => (
          <section key={cat} className="mb-20">
            <div className="flex justify-between items-end mb-8">
              <h2 className="text-3xl font-semibold capitalize">{cat}</h2>
              <a href={`/products/${cat}`} className="text-sm underline">See All →</a>
            </div>
            <ProductGrid products={getProductsByCategory(cat, 10)} />
          </section>
        ))}
      </div>
    </main>
  );
}