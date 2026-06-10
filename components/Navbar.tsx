export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 bg-black border-b border-zinc-900 py-8 w-full">
      <div className="flex flex-col items-center justify-center w-full">
        {/* N O M A D লেখাটি সেন্টার করার জন্য text-center যোগ করা হয়েছে */}
        <h1 className="text-4xl font-black text-center">
          N O M A D
        </h1>
        
        {/* স্লোগান লোগোর কাছে এবং সেন্টারে */}
        <p className="text-zinc-500 italic text-sm mt-1 text-center">
          The one. Everywhere.
        </p>
      </div>
    </nav>
  );
}
