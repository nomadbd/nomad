export default function SiteFooter({ footer }) {
  return (
    <footer style={{ textAlign: 'center', padding: '60px 20px', background: '#050505', borderTop: '1px solid #111' }}>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '25px', marginBottom: '30px' }}>
        <a href="https://facebook.com/nomadbysh" style={{ color: '#fff', textDecoration: 'none', fontSize: '10px' }}>FACEBOOK</a>
        <a href="mailto:contact@nomad.com" style={{ color: '#fff', textDecoration: 'none', fontSize: '10px' }}>EMAIL</a>
        <a href="https://wa.me/8801521731371" style={{ color: '#fff', textDecoration: 'none', fontSize: '10px' }}>WHATSAPP</a>
      </div>
      <p style={{ letterSpacing: '6px', fontSize: '8px', color: '#111' }}>{footer}</p>
    </footer>
  );
}
