export default function Footer() {
  return (
    <footer className="border-t border-zinc-900 bg-[#050505] py-16 px-6">
      <div className="max-w-4xl mx-auto flex flex-col items-center">
        
        {/* ব্র্যান্ডের একটি সংক্ষিপ্ত নাম বা ট্যাগলাইন */}
        <h2 className="text-xl font-bold tracking-[0.2em] text-white uppercase mb-8">
          NOMAD
        </h2>

        {/* লিংকগুলো সুন্দরভাবে সাজানো */}
        <div className="flex flex-wrap justify-center gap-x-12 gap-y-4 mb-10">
          <a href="https://facebook.com/nomadbysh" target="_blank" className="text-sm text-zinc-400 hover:text-white uppercase tracking-widest transition-all duration-300">
            Facebook
          </a>
          <a href="mailto:nomadbysh@gmail.com" className="text-sm text-zinc-400 hover:text-white uppercase tracking-widest transition-all duration-300">
            Email
          </a>
          <a href="https://wa.me/8801521731371" target="_blank" className="text-sm text-zinc-400 hover:text-white uppercase tracking-widest transition-all duration-300">
            WhatsApp
          </a>
        </div>

        {/* কপিরাইট লাইন - ছোট এবং মার্জিত */}
        <p className="text-zinc-600 text-[10px] uppercase tracking-[0.3em]">
          © 2026 Nomad by SH. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
