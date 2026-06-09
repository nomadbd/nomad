export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 bg-black border-b border-zinc-900 py-8">
      <div className="flex flex-col items-center justify-center">
        {/* লোগো */}
        <h1 
          className="text-3xl font-black text-white tracking-[0.4em] uppercase"
          style={{ paddingLeft: '0.4em' }} // সেন্টার ঠিক করার জন্য সামান্য প্যাডিং
        >
          NOMAD
        </h1>
        
        {/* স্লোগান: লোগোর সাথে মিল রেখে স্পেসিং */}
        <p className="text-zinc-500 italic text-[10px] uppercase tracking-[0.4em] mt-1 ml-[0.4em]">
          The one. Everywhere.
        </p>
      </div>
    </nav>
  );
}
