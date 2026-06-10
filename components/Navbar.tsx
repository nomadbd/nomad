export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 bg-black border-b border-zinc-900 py-8 w-full flex justify-center">
      <div className="flex flex-col items-center justify-center text-center w-full">
        <h1 className="text-4xl font-black block w-full text-center">
          N O M A D
        </h1>
        <p className="text-zinc-500 italic text-sm mt-1 block w-full text-center">
          The one. Everywhere.
        </p>
      </div>
    </nav>
  );
}
