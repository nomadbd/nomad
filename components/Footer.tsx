export default function Footer() {
  return (
    <footer className="border-t border-zinc-800 bg-[#050505] py-24 px-6">
      <div className="max-w-2xl mx-auto text-center">
        
        {/* Brand Name */}
        <div className="mb-8">
          <h2 className="text-white text-3xl tracking-[-0.02em] font-light">
            NOMAD
          </h2>
        </div>

        {/* Premium Description */}
        <p className="text-zinc-400 text-[15px] leading-relaxed max-w-md mx-auto mb-14">
          Nomad embodies the spirit of the modern explorer — 
          blending refined urban aesthetics with exceptional comfort. 
          Timeless pieces crafted for those who value simplicity and quality.
        </p>

        {/* Links */}
        <div className="flex justify-center items-center gap-12 mb-16">
          <a 
            href="https://facebook.com/nomadbysh" 
            target="_blank"
            className="text-white hover:text-zinc-300 text-sm tracking-[0.125em] uppercase transition-all duration-300"
          >
            Facebook
          </a>
          <a 
            href="mailto:nomadbysh@gmail.com" 
            className="text-white hover:text-zinc-300 text-sm tracking-[0.125em] uppercase transition-all duration-300"
          >
            Email
          </a>
          <a 
            href="https://wa.me/8801521731371" 
            target="_blank"
            className="text-white hover:text-zinc-300 text-sm tracking-[0.125em] uppercase transition-all duration-300"
          >
            WhatsApp
          </a>
        </div>

        {/* Copyright */}
        <p className="text-zinc-700 text-xs tracking-[0.125em] uppercase">
          © {new Date().getFullYear()} Nomad by SH. All Rights Reserved.
        </p>

      </div>
    </footer>
  );
}