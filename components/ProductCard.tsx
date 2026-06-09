export default function ProductCard({ title, price, image }: any) {
  return (
    <div className="bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800">
      <div className="aspect-square w-full overflow-hidden">
        <img src={image} alt={title} className="w-full h-full object-cover" />
      </div>
      <div className="p-4">
        <h3 className="text-sm font-medium">{title}</h3>
        <p className="text-zinc-400 text-xs mt-1">৳{price}</p>
        <a 
          href={`https://wa.me/8801521731371?text=Order: ${title}`} 
          target="_blank"
          className="mt-3 block w-full bg-white text-black text-center text-xs font-bold py-2 rounded-lg"
        >
          ORDER NOW
        </a>
      </div>
    </div>
  );
}
