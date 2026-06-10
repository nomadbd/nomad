export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 bg-[#050505] border-b border-zinc-800 py-10 w-full flex justify-center">
      <div className="flex flex-col items-center justify-center text-center w-full px-4">
        {/* NOMAD টেক্সট: স্পেসিং বাড়িয়ে আরও প্রিমিয়াম করা হয়েছে */}
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-[0.3em] text-white uppercase">
          NOMAD
        </h1>
        
        {/* স্লোগান: ফন্ট সাইজ ছোট এবং বর্ণহীন (zinc-400) রাখা হয়েছে */}
        <p className="text-zinc-400 italic text-xs md:text-sm tracking-[0.2em] mt-3 uppercase">
          The one. Everywhere.
        </p>
      </div>
    </nav>
  );
}
