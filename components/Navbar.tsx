import { Mail, MessageCircle } from 'lucide-react';

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 backdrop-blur-md bg-black/80 border-b border-zinc-900">
      <div className="flex flex-col md:flex-row justify-between items-center py-5 px-6 md:px-12 gap-4">
        <div className="text-center md:text-left">
          <h1 className="text-2xl font-bold tracking-tighter">NOMAD</h1>
          <p className="text-zinc-500 italic text-[10px] uppercase tracking-widest">The one. Everywhere.</p>
        </div>

        <div className="flex items-center gap-3">
          <a href="mailto:nomadbysh@gmail.com" className="p-2 text-zinc-400 hover:text-white transition">
            <Mail size={20} />
          </a>
          <a href="https://wa.me/8801521731371" target="_blank" className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-full text-xs font-bold hover:bg-zinc-200 transition">
            <MessageCircle size={16} />
            WHATSAPP
          </a>
        </div>
      </div>
    </nav>
  );
}
