// components/ProductCard.tsx
export default function ProductCard({ title, price, image }: any) {
  return (
    <div className="group cursor-pointer">
      <div className="overflow-hidden bg-zinc-900 h-80">
        <img src={image} alt={title} className="hover:scale-105 transition duration-500 object-cover w-full h-full" />
      </div>
      <div className="mt-4">
        <h3 className="font-medium text-lg">{title}</h3>
        <p className="text-zinc-400">৳{price}</p>
      </div>
    </div>
  );
}
