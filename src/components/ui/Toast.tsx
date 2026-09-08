interface ToastProps {
  message: string;
  color: string;
}

export default function Toast({ message, color }: ToastProps) {
  return (
    <div style={{ position: 'fixed', top: '20px', right: '20px', background: '#111', color: '#fff', padding: '15px 25px', borderRadius: '5px', borderLeft: `5px solid ${color}`, zIndex: 9999, fontSize: '12px', letterSpacing: '1px', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
      {message}
    </div>
  );
}
