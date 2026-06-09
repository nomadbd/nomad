// components/Navbar.tsx
export default function Navbar() {
  return (
    <nav className="flex justify-between items-center py-6 px-10 border-b border-zinc-900">
      <h1 className="text-2xl font-bold tracking-tighter">NOMAD</h1>
      <p className="text-zinc-500 italic text-sm">The one. Everywhere.</p>
      <a href="https://facebook.com/nomadbysh" target="_blank" className="text-sm border border-white px-4 py-1 rounded-full hover:bg-white hover:text-black transition">Social</a>
    </nav>
  );
}
