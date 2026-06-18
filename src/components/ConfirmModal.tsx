export const ConfirmModal = ({ onConfirm, onCancel }: { onConfirm: () => void, onCancel: () => void }) => (
  <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000 }}>
    <div style={{ background: '#111', padding: '30px', borderRadius: '10px', textAlign: 'center', border: '1px solid #333' }}>
      <p style={{ color: '#fff', marginBottom: '20px', fontSize: '14px' }}>ARE YOU SURE? THIS ACTION CANNOT BE UNDONE.</p>
      <button onClick={onConfirm} style={{ background: '#ff4444', color: '#fff', border: 'none', padding: '10px 20px', marginRight: '10px', cursor: 'pointer' }}>YES</button>
      <button onClick={onCancel} style={{ background: 'transparent', color: '#fff', border: '1px solid #555', padding: '10px 20px', cursor: 'pointer' }}>CANCEL</button>
    </div>
  </div>
);
