// Path: components/ProductCard.tsx
export default function ProductCard({ title, price, bio, image, onDetailsClick }: any) {
  return (
    <div className="bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 flex flex-col h-full">
      {image && (
        <div className="aspect-square w-full overflow-hidden">
          <img src={image} alt={title} className="w-full h-full object-cover" />
        </div>
      )}
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-sm font-medium text-white truncate">{title}</h3>
        {bio && <p className="text-zinc-500 text-[10px] mt-1 line-clamp-2">{bio}</p>}
        
        {/* প্রাইস এবং বাটন পাশাপাশি করার জন্য flex-between */}
        <div className="flex items-center justify-between mt-auto pt-4">
          <span className="text-white text-sm font-bold">{price} BDT</span>
          
          {/* মিনিমাল আউটলাইন বাটন */}
          <button 
            onClick={onDetailsClick}
            className="text-white border border-zinc-600 text-[10px] font-bold px-4 py-1.5 rounded-full hover:bg-zinc-800 transition"
          >
            DETAILS
          </button>
        </div>
      </div>
    </div>
  );
}
