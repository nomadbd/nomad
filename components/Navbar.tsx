export default function Navbar() {
  return (
    <nav className="w-full bg-[#050505] border-b border-zinc-800 py-8">
      <div className="flex flex-col items-center justify-center">
        {/* লোগো: মার্জিত এবং সেন্টারড */}
        <h1 className="text-4xl font-bold tracking-widest text-white uppercase">
          NOMAD
        </h1>
        
        {/* স্লোগান: ছোট এবং মার্জিত */}
        <p className="text-zinc-500 italic text-sm mt-2 tracking-wider">
          The one. Everywhere.
        </p>
      </div>
    </nav>
  );
}
