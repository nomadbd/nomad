import styles from '@/styles/ProductList.module.css';

export default function ProductList({ categories, viewCategory, setViewCategory, setSelectedProduct, setModalType, searchQuery, filteredProducts }) {
  return (
    <main>
      {searchQuery ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', padding: '20px' }}>
          {filteredProducts.map((p, i) => (
            <div key={i} onClick={() => { setSelectedProduct(p); setModalType('details'); }} style={{ background: '#0a0a0a', padding: '10px', borderRadius: '20px', border: '1px solid #111' }}>
              <img src={`/products/${p.image}`} style={{ width: '100%', borderRadius: '15px' }} />
              <p style={{ fontSize: '10px', textAlign: 'center', marginTop: '10px' }}>{p.name}</p>
            </div>
          ))}
        </div>
      ) : viewCategory ? (
        <div style={{ padding: '0 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', margin: '20px 0' }}>
            <span style={{ fontSize: '12px', letterSpacing: '3px' }}>{viewCategory} COLLECTION</span>
            <span onClick={() => setViewCategory(null)} style={{ fontSize: '10px', color: '#444' }}>BACK</span>
          </div>
          {categories[viewCategory].map((p, i) => (
            <div key={i} style={{ marginBottom: '40px', background: '#0a0a0a', borderRadius: '40px', border: '1px solid #1a1a1a', overflow: 'hidden' }}>
              <img src={`/products/${p.image}`} style={{ width: '100%' }} />
              <h3 style={{ textAlign: 'center', fontSize: '18px', margin: '20px 0' }}>{p.name}</h3>
              <div style={{ display: 'flex', gap: '10px', padding: '0 20px 20px' }}>
                <button className="btn-style" onClick={() => { setSelectedProduct(p); setModalType('details'); }}>DETAILS</button>
                <button className="btn-style" onClick={() => { setSelectedProduct(p); setModalType('order'); }}>ORDER</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        Object.keys(categories).map(cat => (
          <section key={cat} style={{ marginBottom: '40px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 30px 15px' }}>
              <span style={{ fontSize: '12px', letterSpacing: '3px', color: '#666' }}>{cat}</span>
              <span onClick={() => setViewCategory(cat)} style={{ fontSize: '10px', color: '#fff', borderBottom: '1px solid #333' }}>SEE MORE</span>
            </div>
            <div className="scroll-container">
              {categories[cat].map((p, i) => (
                <div key={i} className="cat-item">
                  <img src={`/products/${p.image}`} style={{ width: '100%' }} />
                  <div style={{ padding: '25px 20px', textAlign: 'center' }}>
                    <p style={{ fontSize: '16px', letterSpacing: '1px', marginBottom: '20px' }}>{p.name}</p>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button className="btn-style" onClick={() => { setSelectedProduct(p); setModalType('details'); }}>DETAILS</button>
                      <button className="btn-style" onClick={() => { setSelectedProduct(p); setModalType('order'); }}>ORDER</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))
      )}
    </main>
  );
}
