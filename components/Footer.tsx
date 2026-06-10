export default function Footer() {
  return (
    <footer style={{ 
      width: '100%', 
      backgroundColor: '#050505', 
      paddingTop: '64px', 
      paddingBottom: '64px', 
      textAlign: 'center',
      borderTop: '1px solid #18181b'
    }}>
      <div style={{ maxWidth: '400px', margin: '0 auto', padding: '0 20px' }}>
        
        <p style={{ color: '#71717a', fontSize: '14px', lineHeight: '1.6', marginBottom: '40px' }}>
          At Nomad, we craft essentials for your modern journey.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '30px', marginBottom: '40px' }}>
          <a href="https://facebook.com/nomadbysh" target="_blank" style={{ color: '#ffffff', textDecoration: 'none', fontSize: '12px', letterSpacing: '2px', textTransform: 'uppercase' }}>Facebook</a>
          <a href="mailto:nomadbysh@gmail.com" style={{ color: '#ffffff', textDecoration: 'none', fontSize: '12px', letterSpacing: '2px', textTransform: 'uppercase' }}>Email</a>
          <a href="https://wa.me/8801521731371" target="_blank" style={{ color: '#ffffff', textDecoration: 'none', fontSize: '12px', letterSpacing: '2px', textTransform: 'uppercase' }}>WhatsApp</a>
        </div>

        <p style={{ color: '#3f3f46', fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase' }}>
          © 2026 Nomad by SH
        </p>
      </div>
    </footer>
  );
}
