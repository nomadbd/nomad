import styles from '@/styles/SearchBar.module.css';
export default function SearchBar({ announcement, searchQuery, setSearchQuery }) {
  return (
    <div style={{ maxWidth: '400px', margin: '0 auto 30px', padding: '0 20px' }}>
      <div style={{ background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: '25px', padding: '20px', textAlign: 'center' }}>
        {announcement && !searchQuery && <p style={{ fontSize: '10px', letterSpacing: '2px', color: '#fff', marginBottom: '15px' }}>{announcement}</p>}
        <input type="text" placeholder="SEARCH PRODUCT" onChange={(e)=>setSearchQuery(e.target.value)} style={{ background: 'none', border: 'none', color: '#fff', textAlign: 'center', width: '100%', fontSize: '11px', letterSpacing: '2px' }} />
      </div>
    </div>
  );
}
