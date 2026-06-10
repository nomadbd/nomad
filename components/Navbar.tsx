// components/Navbar.tsx
export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 bg-black border-b border-zinc-900 py-8 w-full">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <div className="flex flex-col items-center text-center">
          <h1 className="text-4xl md:text-5xl font-black tracking-[0.5em] text-white">
            N O M A D
          </h1>
          <p className="text-zinc-500 italic text-sm md:text-base mt-2">
            The one. Everywhere.
          </p>
        </div>
      </div>
    </nav>
  );
}