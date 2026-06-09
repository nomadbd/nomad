export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 bg-black border-b border-zinc-900 py-6">
      <div className="flex flex-col items-center justify-center">
        {/* লোগো: N O M A D স্টাইলে */}
        <h1 className="text-3xl font-bold tracking-[0.5em] uppercase">
          NOMAD
        </h1>
        
        {/* স্লোগান: ধূসর রঙে এবং কম গ্যাপে */}
        <p className="text-zinc-500 italic text-[10px] tracking-widest mt-0.5">
          The one. Everywhere.
        </p>
      </div>
    </nav>
  );
}
