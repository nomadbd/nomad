// Path: components/ProductCard.tsx
export default function ProductCard({ title, price, bio, image, onDetailsClick }: any) {
  return (
    <div className="bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 flex flex-col h-full">
      {/* ইমেজ থাকলে দেখাবে, না থাকলে দেখাবে না */}
      {image && (
        <div className="aspect-square w-full overflow-hidden">
          <img src={image} alt={title} className="w-full h-full object-cover" />
        </div>
      )}
      
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-sm font-medium text-white">{title}</h3>
        {bio && <p className="text-zinc-500 text-[10px] mt-1 line-clamp-2">{bio}</p>}
        
        <p className="text-zinc-300 text-xs font-semibold mt-auto pt-2">
           Price : {price}
        </p>
        
        <button 
          onClick={onDetailsClick}
          className="mt-4 w-full bg-zinc-800 text-white text-xs font-bold py-2 rounded-lg border border-zinc-700 hover:bg-zinc-700 transition"
        >
          DETAILS
        </button>
      </div>
    </div>
  );
}
