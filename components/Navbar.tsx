import { Mail, MessageCircle } from 'lucide-react';

export default function Navbar() {
  return (
    <nav className="flex flex-col md:flex-row justify-between items-center py-6 px-6 md:px-10 border-b border-zinc-900 gap-4">
      {/* লোগো ও স্লোগান */}
      <div className="text-center md:text-left">
        <h1 className="text-3xl font-bold tracking-tighter">NOMAD</h1>
        <p className="text-zinc-500 italic text-xs">The one. Everywhere.</p>
      </div>

      {/* কন্টাক্ট এবং সোশ্যাল বাটন */}
      <div className="flex items-center gap-4">
        <a 
          href="mailto:nomadbysh@gmail.com" 
          className="p-2 border border-zinc-800 rounded-full hover:bg-zinc-800 transition"
          title="Email Us"
        >
          <Mail size={18} />
        </a>
        <a 
          href="https://wa.me/8801521731371" 
          target="_blank"
          className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-full text-sm font-medium hover:bg-zinc-200 transition"
        >
          <MessageCircle size={18} />
          <span>WhatsApp</span>
        </a>
        <a 
          href="https://facebook.com/nomadbysh" 
          target="_blank" 
          className="text-sm text-zinc-400 hover:text-white transition"
        >
          @nomadbysh
        </a>
      </div>
    </nav>
  );
}
