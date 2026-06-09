export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 bg-black border-b border-zinc-900 py-8">
      <div className="max-w-7xl mx-auto px-6 flex flex-col items-center justify-center">
        {/* লোগো */}
        <h1 className="text-5xl font-black tracking-tighter">
          N O M A D
        </h1>

        {/* স্লোগান */}
        <p className="text-zinc-500 italic text-sm tracking-[3px] -mt-1">
          The one. Everywhere.
        </p>
      </div>
    </nav>
  );
}