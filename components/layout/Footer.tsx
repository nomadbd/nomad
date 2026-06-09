export default function Footer() {
  return (
    <footer className="bg-black text-white py-16">
      <div className="max-w-7xl mx-auto px-6 text-center">
        <div className="text-3xl font-serif tracking-widest mb-8">NOMAD</div>
        
        <div className="flex flex-wrap justify-center gap-x-12 gap-y-4 text-sm mb-12">
          <a href="https://facebook.com/nomadbysh" target="_blank">Facebook</a>
          <a href="mailto:nomadbysh@gmail.com">Email</a>
          <a href="https://wa.me/8801521731371" target="_blank">WhatsApp</a>
        </div>

        <p className="text-xs text-gray-500">
          © 2026 nomad by sh. All Rights Reserved.
        </p>
      </div>
    </footer>
  );
}