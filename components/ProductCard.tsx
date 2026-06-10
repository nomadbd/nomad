// Path: components/ProductCard.tsx

export default function ProductCard({ title, price, bio, onDetailsClick }: any) {
  return (
    <div className="bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800">
      <div className="aspect-square w-full overflow-hidden">
        {/* ইমেজের অংশ */}
      </div>
      <div className="p-4">
        <h3 className="text-sm font-medium text-white">{title}</h3>
        <p className="text-zinc-400 text-xs mt-1">৳{price}</p>
        <p className="text-zinc-500 text-[10px] mt-2 italic">{bio}</p>
        
        <button 
          onClick={onDetailsClick}
          className="mt-4 block w-full bg-zinc-800 text-white text-center text-xs font-semibold py-2 rounded-lg border border-zinc-700 hover:bg-zinc-700 transition"
        >
          DETAILS
        </button>
      </div>
    </div>
  );
}
