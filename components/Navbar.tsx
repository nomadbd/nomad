export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 bg-black border-b border-zinc-900 py-8 w-full">
      {/* flex-col এবং items-center এখানেও নিশ্চিত করা হলো */}
      <div className="flex flex-col items-center justify-center w-full">
        {/* mx-auto যোগ করা হয়েছে যা লেফট/রাইট মার্জিন সমান রাখবে */}
        <h1 className="text-4xl font-black text-center w-full mx-auto">
          N O M A D
        </h1>
        <p className="text-zinc-500 italic text-sm mt-1 text-center w-full mx-auto">
          The one. Everywhere.
        </p>
      </div>
    </nav>
  );
}
