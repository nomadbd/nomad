export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 bg-black border-b border-zinc-900 py-8">
      <div className="flex flex-col items-center justify-center">
        <h1 className="text-4xl font-black tracking-tighter">NOMAD</h1>
        <p className="text-zinc-500 italic text-sm tracking-widest mt-1">
          The one. Everywhere.
        </p>
      </div>
    </nav>
  );
}
