export default function Navbar() {
  return (
    <nav style={{ width: '100%', display: 'flex', justifyContent: 'center', padding: '32px 0', borderBottom: '1px solid #333', background: '#000' }}>
      <div style={{ textAlign: 'center', width: '100%' }}>
        <h1 style={{ fontSize: '2.25rem', fontWeight: '900', margin: 0, padding: 0 }}>
          N O M A D
        </h1>
        <p style={{ color: '#71717a', fontStyle: 'italic', fontSize: '0.875rem', marginTop: '4px' }}>
          The one. Everywhere.
        </p>
      </div>
    </nav>
  );
}
