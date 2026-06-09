export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 bg-black border-b border-zinc-900 py-6">
      <div className="flex flex-col items-center justify-center gap-0">
        {/* N O M A D স্টাইল: সরাসরি লেটার স্পেসিং দেওয়া */}
        <h1 
          className="text-3xl font-black text-white"
          style={{ letterSpacing: '0.4em', paddingLeft: '0.4em' }}
        >
          NOMAD
        </h1>
        
        {/* স্লোগান: একদম কাছে আনার জন্য negative margin */}
        <p className="text-zinc-500 italic text-[10px] uppercase tracking-[0.2em] -mt-1">
          The one. Everywhere.
        </p>
      </div>
    </nav>
  );
}
