export default function Footer() {
  return (
    <footer className="border-t border-zinc-900 bg-[#050505] py-20 px-6">
      <div className="max-w-2xl mx-auto flex flex-col items-center text-center">
        
        {/* ব্র্যান্ড ডেসক্রিপশন - ৪-৫ বাক্য */}
        <p className="text-zinc-500 text-sm leading-relaxed mb-12 max-w-lg">
          Nomad represents the spirit of the modern traveler. We believe in simplicity, comfort, and unmatched quality for every individual. Our designs are crafted to keep you ahead, blending urban aesthetics with timeless style. Every piece tells a story, and every stitch is made for those who never stop exploring. Join us in defining the new standard of apparel.
        </p>

        {/* লিংকগুলো */}
        <div className="flex flex-wrap justify-center gap-8 mb-12">
          <a href="https://facebook.com/nomadbysh" target="_blank" className="text-white hover:text-zinc-300 transition-colors uppercase tracking-widest text-xs">Facebook</a>
          <a href="mailto:nomadbysh@gmail.com" className="text-white hover:text-zinc-300 transition-colors uppercase tracking-widest text-xs">Email</a>
          <a href="https://wa.me/8801521731371" target="_blank" className="text-white hover:text-zinc-300 transition-colors uppercase tracking-widest text-xs">WhatsApp</a>
        </div>

        {/* কপিরাইট */}
        <p className="text-zinc-600 text-[10px] uppercase tracking-[0.3em]">
          © 2026 Nomad by SH. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
