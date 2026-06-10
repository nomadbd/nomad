export default function Footer() {
  return (
    <footer className="border-t border-zinc-900 bg-[#050505] py-16 px-6 text-center">
      <div className="max-w-md mx-auto">
        
        {/* ২ বাক্যের ডেসক্রিপশন */}
        <p className="text-zinc-500 text-sm leading-relaxed mb-10">
          Nomad embodies the spirit of the modern explorer, blending urban aesthetics with unmatched comfort. Each piece is crafted to redefine your daily style with simplicity and quality.
        </p>

        {/* লিঙ্কগুলো - আলাদা আলাদা এবং সাদা */}
        <div className="flex justify-center items-center gap-10 mb-10">
          <a href="https://facebook.com/nomadbysh" target="_blank" className="text-white hover:text-zinc-400 uppercase tracking-widest text-xs transition-colors">
            Facebook
          </a>
          <a href="mailto:nomadbysh@gmail.com" className="text-white hover:text-zinc-400 uppercase tracking-widest text-xs transition-colors">
            Email
          </a>
          <a href="https://wa.me/8801521731371" target="_blank" className="text-white hover:text-zinc-400 uppercase tracking-widest text-xs transition-colors">
            WhatsApp
          </a>
        </div>

        {/* কপিরাইট */}
        <p className="text-zinc-700 text-[10px] uppercase tracking-[0.2em]">
          © 2026 Nomad by SH
        </p>
      </div>
    </footer>
  );
}
