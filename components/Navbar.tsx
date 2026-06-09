export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 bg-black border-b border-zinc-900 py-8">
      <div className="flex flex-col items-center justify-center">
        {/* এখানে সরাসরি N O M A D লিখে দিলাম */}
        <h1 className="text-4xl font-black">N O M A D</h1>
        
        {/* স্লোগানটি লোগোর কাছে আনার জন্য -mt-2 ব্যবহার করলাম */}
        <p className="text-zinc-500 italic text-sm tracking-widest -mt-2">
          The one. Everywhere.
        </p>
      </div>
    </nav>
  );
}
