interface DeleteAccountModalProps {
  isOpen: boolean;
  deleteConfirmPassword: string;
  deleteAccountError: string | null;
  deletingAccount: boolean;
  onPasswordChange: (value: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function DeleteAccountModal({
  isOpen,
  deleteConfirmPassword,
  deleteAccountError,
  deletingAccount,
  onPasswordChange,
  onCancel,
  onConfirm,
}: DeleteAccountModalProps) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1200,
        padding: '20px',
      }}
    >
      <div
        style={{
          background: '#111',
          border: '1px solid #222',
          borderRadius: '8px',
          padding: '25px',
          maxWidth: '400px',
          width: '100%',
        }}
      >
        <h3
          style={{
            margin: '0 0 10px 0',
            fontSize: '16px',
            color: '#ff4444',
            letterSpacing: '1px',
          }}
        >
          DELETE ACCOUNT
        </h3>

        <p
          style={{
            fontSize: '13px',
            color: '#ccc',
            marginBottom: '20px',
          }}
        >
          This action is permanent. Enter your password to confirm deletion:
        </p>

        <input
          type="password"
          placeholder="Password"
          value={deleteConfirmPassword}
          onChange={(event) => onPasswordChange(event.target.value)}
          style={{
            width: '100%',
            padding: '10px 0',
            background: 'transparent',
            border: 'none',
            borderBottom: deleteAccountError
              ? '1px solid #F87171'
              : '1px solid #333',
            color: '#fff',
            marginBottom: deleteAccountError ? '8px' : '20px',
            outline: 'none',
            fontSize: '15px',
            boxSizing: 'border-box',
          }}
        />

        {deleteAccountError && (
          <p
            style={{
              color: '#F87171',
              fontSize: '11px',
              margin: '0 0 16px 0',
            }}
          >
            {deleteAccountError}
          </p>
        )}

        <div
          style={{
            display: 'flex',
            gap: '10px',
            justifyContent: 'flex-end',
          }}
        >
          <button
            type="button"
            disabled={deletingAccount}
            onClick={onCancel}
            style={{
              background: 'transparent',
              border: '1px solid #333',
              color: '#aaa',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              letterSpacing: '1px',
            }}
          >
            CANCEL
          </button>

          <button
            type="button"
            disabled={deletingAccount}
            onClick={onConfirm}
            style={{
              background: '#ff4444',
              border: 'none',
              color: '#fff',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: deletingAccount ? 'wait' : 'pointer',
              fontSize: '12px',
              letterSpacing: '1px',
            }}
          >
            {deletingAccount ? 'DELETING...' : 'DELETE'}
          </button>
        </div>
      </div>
    </div>
  );
}
