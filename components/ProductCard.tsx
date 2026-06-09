import { ShoppingBag } from 'lucide-react';

export default function ProductCard({ title, price, image }: any) {
  const whatsappUrl = `https://wa.me/8801521731371?text=I want to order: ${title}. Price: ৳${price}`;

  return (
    <div className="group bg-zinc-900/30 border border-zinc-800 rounded-3xl overflow-hidden hover:border-zinc-600 transition-all duration-500">
      <div className="h-80 overflow-hidden relative">
        <img src={image} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
      </div>
      <div className="p-6">
        <h3 className="text-lg font-medium tracking-tight">{title}</h3>
        <p className="text-zinc-400 text-sm mb-4">৳{price}</p>
        <a href={whatsappUrl} target="_blank" className="flex items-center justify-center gap-2 w-full border border-white py-2 rounded-full text-xs font-bold hover:bg-white hover:text-black transition uppercase">
          <ShoppingBag size={14} /> Order Now
        </a>
      </div>
    </div>
  );
}
