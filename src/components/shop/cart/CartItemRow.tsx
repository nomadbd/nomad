import React from 'react';

interface CartItemRowProps {
  item: any;
  itemKey: string;
  isSelected: boolean;
  onToggleSelect: (itemKey: string) => void;
  onIncrement: (id: any, color?: any, size?: any) => void;
  onDecrement: (id: any, color?: any, size?: any) => void;
}

const CartItemRow: React.FC<CartItemRowProps> = ({
  item,
  itemKey,
  isSelected,
  onToggleSelect,
  onIncrement,
  onDecrement,
}) => {
  const itemImage =
    item.image_url ||
    item.product_media?.find((m: any) => m.media_type === 'image')?.media_url ||
    item.product_media?.[0]?.media_url;

  return (
    <div
      style={{
        display: 'flex',
        gap: '18px',
        alignItems: 'center',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        paddingBottom: '20px',
      }}
    >
      <img
        src={itemImage}
        alt={item.name}
        style={{
          width: '70px',
          height: '90px',
          objectFit: 'cover',
          border: '1px solid rgba(255,255,255,0.06)',
          backgroundColor: '#111',
          flexShrink: 0,
        }}
      />

      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
            <h4
              style={{
                margin: 0,
                fontSize: '13px',
                fontWeight: '500',
                color: '#f5f5f5',
                letterSpacing: '0.3px',
                paddingRight: '15px',
                lineHeight: '1.4',
                wordBreak: 'break-word',
              }}
            >
              {item.name}
            </h4>
            {(item.color || item.size) && (
              <div
                style={{
                  fontSize: '10px',
                  color: '#b5b5b5',
                  fontFamily: 'monospace',
                  textTransform: 'uppercase',
                  letterSpacing: '0.8px',
                  fontWeight: '500',
                }}
              >
                {item.color}
                {item.color && item.size ? ' / ' : ''}
                {item.size}
              </div>
            )}
          </div>

          <div
            onClick={() => onToggleSelect(itemKey)}
            style={{
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              border: isSelected ? '1px solid #fff' : '1px solid #666',
              backgroundColor: isSelected ? '#fff' : 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              userSelect: 'none',
              flexShrink: 0,
            }}
          >
            {isSelected && (
              <span style={{ color: '#000', fontSize: '9px', fontWeight: 'bold' }}>✓</span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#0a0a0a',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '2px',
            }}
          >
            <button
              onClick={() => onDecrement(item.id, item.color, item.size)}
              style={{
                background: 'none',
                border: 'none',
                color: '#b5b5b5',
                cursor: 'pointer',
                fontSize: '12px',
                width: '30px',
                height: '26px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                outline: 'none',
              }}
            >
              —
            </button>
            <span
              style={{
                color: 'white',
                fontSize: '12px',
                fontFamily: 'monospace',
                minWidth: '22px',
                textAlign: 'center',
                userSelect: 'none',
                fontWeight: '500',
              }}
            >
              {item.quantity}
            </span>
            <button
              onClick={() => onIncrement(item.id, item.color, item.size)}
              style={{
                background: 'none',
                border: 'none',
                color: '#b5b5b5',
                cursor: 'pointer',
                fontSize: '12px',
                width: '30px',
                height: '26px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                outline: 'none',
              }}
            >
              +
            </button>
          </div>
          <div style={{ color: 'white', fontSize: '13px', fontFamily: 'monospace', fontWeight: '500' }}>
            ৳{item.price * item.quantity}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartItemRow;
