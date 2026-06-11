// Path: components/ProductModal.tsx
export default function ProductModal({ product, onClose }: any) {
  if (!product) return null;

  return (
    // fixed inset-0 পজিশন মোডালকে পুরো স্ক্রিনের উপরে ভাসিয়ে রাখে
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl max-w-sm w-full relative shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 text-white hover:text-zinc-400">✕</button>
        
        {product.image && (
          <img src={product.image} className="rounded-xl mb-4 w-full h-56 object-cover" alt={product.title} />
        )}
        
        <h2 className="text-xl font-bold text-white">{product.title}</h2>
        <p className="text-zinc-400 mt-2 text-sm whitespace-pre-line">{product.fullDetails}</p>

        <div className="mt-6 flex gap-3">
          <a 
            href={`https://wa.me/8801521731371?text=Order: ${product.title}`} 
            className="flex-1 bg-white text-black text-center text-sm font-bold py-3 rounded-xl hover:bg-zinc-200 transition"
          >
            ORDER NOW
          </a>
          <button 
            onClick={onClose}
            className="flex-1 border border-zinc-700 text-white text-center text-sm font-bold py-3 rounded-xl hover:bg-zinc-800 transition"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
}
