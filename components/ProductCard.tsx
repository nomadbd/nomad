 import { ShoppingBag } from 'lucide-react';

export default function ProductCard({ title, price, image }: any) {
  // হোয়াটসঅ্যাপের জন্য প্রি-ফিল্ড মেসেজ
  const whatsappUrl = `https://wa.me/8801521731371?text=Hi, I want to order: ${title}. Price: ৳${price}`;

  return (
    <div className="group relative bg-zinc-950 border border-zinc-900 rounded-2xl overflow-hidden hover:border-zinc-700 transition-all duration-500">
      {/* ইমেজ সেকশন */}
      <div className="overflow-hidden h-96 relative">
        <img 
          src={image} 
          alt={title} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" 
        />
        {/* শ্যাডো ওভারলে */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
      </div>

      {/* প্রোডাক্ট ইনফো */}
      <div className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-xl font-medium tracking-tight">{title}</h3>
            <p className="text-zinc-400 mt-1 text-lg font-light">৳{price}</p>
          </div>
        </div>

        {/* প্রিমিয়াম বাটন */}
        <a 
          href={whatsappUrl}
          target="_blank"
          className="mt-6 flex items-center justify-center gap-2 w-full bg-white text-black py-3 rounded-xl font-semibold hover:bg-zinc-200 transition-all group-hover:shadow-[0_0_20px_rgba(255,255,255,0.15)]"
        >
          <ShoppingBag size={18} />
          <span>Order Now</span>
        </a>
      </div>
    </div>
  );
}
