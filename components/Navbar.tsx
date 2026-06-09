export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 bg-black border-b border-zinc-900 py-8">
      <div className="flex flex-col items-center justify-center">
        <h1 className="text-3xl font-black text-white" style={{ letterSpacing: '0.25em' }}>
          NOMAD
        </h1>
        <p className="text-zinc-500 italic text-[10px] uppercase tracking-[0.2em] mt-1">
          The one. Everywhere.
        </p>
      </div>
    </nav>
  );
}
