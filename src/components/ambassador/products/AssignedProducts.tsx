import React from 'react';

interface AssignedProductsProps {
  assignedProducts: any[];
}

export default function AssignedProducts({ assignedProducts }: AssignedProductsProps) {
  return (
    <section style={{ backgroundColor: '#0a0a0a', border: '1px solid #222', borderRadius: '8px', padding: '24px' }}>
      <h3 style={{ fontSize: '15px', margin: '0 0 16px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>Assigned Showcase Products</h3>
      {assignedProducts.length === 0 ? (
        <p style={{ color: '#666', fontSize: '13px', margin: 0 }}>No products assigned by admin yet.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
          {assignedProducts.map((p: any) => (
            <div key={p.id} style={{ backgroundColor: '#111', border: '1px solid #222', borderRadius: '6px', padding: '12px' }}>
              <h4 style={{ fontSize: '14px', margin: '0 0 4px 0', color: '#fff' }}>{p.name}</h4>
              <p style={{ fontSize: '12px', color: '#d4af37', margin: 0 }}>৳{p.price}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
