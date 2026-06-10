// Path: components/ProductModal.tsx

export default function ProductModal({ product, onClose }: any) {
  if (!product) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 max-w-sm w-full">
        <h2 className="text-xl font-bold text-white">{product.title}</h2>
        <p className="text-zinc-400 mt-2">{product.fullDetails}</p>
        
        <div className="mt-6 flex gap-2">
          <a 
            href={`https://wa.me/8801521731371?text=Order: ${product.title}`} 
            className="flex-1 bg-white text-black text-center text-sm font-bold py-3 rounded-lg"
          >
            ORDER
          </a>
          <button 
            onClick={onClose}
            className="flex-1 bg-zinc-800 text-white text-center text-sm font-bold py-3 rounded-lg"
          >
            CANCEL
          </button>
        </div>
      </div>
    </div>
  );
}
