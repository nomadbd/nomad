export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 bg-black border-b border-zinc-900 py-8 w-full">
      {/* w-full এবং items-center নিশ্চিত করবে যেন পুরো কন্টেইনারটি সেন্টারে থাকে */}
      <div className="flex flex-col items-center justify-center w-full">
        
        {/* N O M A D লেখাটি সেন্টার করার জন্য text-center যোগ করা হয়েছে */}
        <h1 className="text-4xl font-black text-center w-full">
          N O M A D
        </h1>
        
        {/* স্লোগানটিও সেন্টারে থাকার জন্য text-center ব্যবহার করা হয়েছে */}
        <p className="text-zinc-500 italic text-sm tracking-widest mt-1 text-center w-full">
          The one. Everywhere.
        </p>
      </div>
    </nav>
  );
}
