export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 bg-black border-b border-zinc-900 py-8 w-full">
      <div className="flex flex-col items-center justify-center w-full">
        <h1 className="text-3xl font-black text-white uppercase" style={{ letterSpacing: '0.4em' }}>
          NOMAD
        </h1>
        <p className="text-zinc-500 italic text-[10px] uppercase tracking-[0.4em] mt-1">
          The one. Everywhere.
        </p>
      </div>
    </nav>
  );
}
