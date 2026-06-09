export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 bg-black border-b border-zinc-900 py-8 w-full">
      <div className="w-full max-w-7xl mx-auto px-6 flex flex-col items-center justify-center">
        <h1 className="text-5xl font-black tracking-tighter text-center">
          N O M A D
        </h1>

        <p className="text-zinc-500 italic text-sm tracking-[3px] -mt-1 text-center">
          The one. Everywhere.
        </p>
      </div>
    </nav>
  );
}