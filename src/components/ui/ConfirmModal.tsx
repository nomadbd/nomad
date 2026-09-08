interface ConfirmModalProps {
  isOpen: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({ isOpen, message, onConfirm, onCancel }: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
      <div style={{ background: '#111', padding: '30px', borderRadius: '10px', textAlign: 'center', border: '1px solid #333', maxWidth: '300px' }}>
        <p style={{ marginBottom: '20px', fontSize: '14px' }}>{message}</p>
        <button onClick={onConfirm} style={{ background: '#ff4444', border: 'none', padding: '10px 20px', color: '#fff', marginRight: '10px', cursor: 'pointer' }}>Yes</button>
        <button onClick={onCancel} style={{ background: 'transparent', border: '1px solid #555', padding: '10px 20px', color: '#fff', cursor: 'pointer' }}>No</button>
      </div>
    </div>
  );
}
