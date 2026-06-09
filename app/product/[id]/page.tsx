import { getProductById } from '@/lib/products';
import Image from 'next/image';
import OrderForm from './OrderForm';

export default function ProductPage({ params }: { params: { id: string } }) {
  const product = getProductById(params.id);

  if (!product) return <div>Product not found</div>;

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 grid md:grid-cols-2 gap-12">
      <div>
        {product.images.map((img, i) => (
          <Image key={i} src={img} alt="" width={800} height={1000} className="mb-4" />
        ))}
      </div>

      <div>
        <h1 className="text-4xl font-semibold">{product.name}</h1>
        <p className="text-3xl mt-4">৳ {product.price}</p>
        
        <OrderForm product={product} />
      </div>
    </div>
  );
}