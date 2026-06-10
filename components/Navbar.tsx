// components/Navbar.tsx
export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 bg-black border-b border-zinc-900 py-8 w-full">
      <div className="max-w-7xl mx-auto px-4 md:px-10 flex flex-col items-center text-center">
        <h1 className="text-4xl font-black tracking-widest">
          N O M A D
        </h1>
        <p className="text-zinc-500 italic text-sm mt-1">
          The one. Everywhere.
        </p>
      </div>
    </nav>
  );
}