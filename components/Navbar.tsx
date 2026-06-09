export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 bg-black border-b border-zinc-900 py-8">
      <div className="flex flex-col items-center justify-center gap-0">
        
        {/* N O M A D: ফ্লেক্স দিয়ে প্রতিটি অক্ষর আলাদা করে সাজানো */}
        <div className="flex gap-[0.5em] text-3xl font-black text-white">
          <span>N</span>
          <span>O</span>
          <span>M</span>
          <span>A</span>
          <span>D</span>
        </div>
        
        {/* স্লোগান: লোগোর সাথে সামঞ্জস্যপূর্ণ স্পেসিং */}
        <p className="text-zinc-500 italic text-[10px] uppercase tracking-[0.2em] mt-1 text-center">
          The one. Everywhere.
        </p>
      </div>
    </nav>
  );
}
