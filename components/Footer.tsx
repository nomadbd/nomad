export default function Footer() {
  return (
    <footer className="border-t border-zinc-900 bg-black py-12 px-6 text-center">
      <div className="flex justify-center gap-8 mb-8">
        <a href="https://facebook.com/nomadbysh" target="_blank" className="text-sm text-zinc-400 hover:text-white transition">Facebook</a>
        <a href="mailto:nomadbysh@gmail.com" className="text-sm text-zinc-400 hover:text-white transition">Email</a>
        <a href="https://wa.me/8801521731371" target="_blank" className="text-sm text-zinc-400 hover:text-white transition">WhatsApp</a>
      </div>
      <p className="text-zinc-600 text-xs tracking-tight">
        nomad by sh © 2026
      </p>
    </footer>
  );
}
