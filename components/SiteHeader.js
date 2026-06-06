export default function SiteHeader({ header }) {
  return (
    <header style={{ textAlign: 'center', padding: '40px 20px' }}>
      <h1 style={{ letterSpacing: '12px', fontSize: '24px', fontWeight: '900', margin: 0 }}>NOMAD</h1>
      <p style={{ fontSize: '7px', color: '#444', letterSpacing: '4px', marginTop: '8px' }}>{header}</p>
    </header>
  );
}
