import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';

interface OrderItem {
  id: string;
  return_reason?: string | null;
  created_at: string;
}

export default function AdminLogistics() {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Store Settings States
  const [deliveryCharge, setDeliveryCharge] = useState<number | string>('');
  const [vatRate, setVatRate] = useState<number | string>('');
  const [initialDeliveryCharge, setInitialDeliveryCharge] = useState<number | string>('');
  const [initialVatRate, setInitialVatRate] = useState<number | string>('');
  const [settingId, setSettingId] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('id, return_reason, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('store_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        const dc = data.delivery_charge ?? 100;
        const vat = data.vat_rate ?? 0.05;
        setSettingId(data.id);
        setDeliveryCharge(dc);
        setVatRate(vat);
        setInitialDeliveryCharge(dc);
        setInitialVatRate(vat);
      }
    } catch (err) {
      console.error('Error fetching store settings:', err);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchSettings();
  }, []);

  const handleStartEdit = () => {
    setIsEditing(true);
    setDeliveryCharge('');
    setVatRate('');
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      const targetId = settingId ?? 1;
      const finalDc = deliveryCharge === '' ? initialDeliveryCharge : deliveryCharge;
      const finalVat = vatRate === '' ? initialVatRate : vatRate;

      const { data, error } = await supabase
        .from('store_settings')
        .update({
          delivery_charge: Number(finalDc),
          vat_rate: Number(finalVat),
          updated_at: new Date().toISOString()
        })
        .eq('id', targetId)
        .select();

      if (error) throw error;

      if (!data || data.length === 0) {
        alert('Update failed in Supabase!');
        handleCancel();
        return;
      }

      setInitialDeliveryCharge(finalDc);
      setInitialVatRate(finalVat);
      setDeliveryCharge(finalDc);
      setVatRate(finalVat);
      setIsEditing(false);
    } catch (err: any) {
      alert('Failed to save settings: ' + err.message);
      handleCancel();
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setDeliveryCharge(initialDeliveryCharge);
    setVatRate(initialVatRate);
    setIsEditing(false);
  };

  return (
    <div style={{ color: '#fff', width: '100%' }}>
      {/* Delivery Charge & VAT Rate Input Bar */}
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'flex-start', width: '100%' }}>
        <div style={{
          display: 'flex',
          flexDirection: 'row',
          flexWrap: 'nowrap',
          gap: '8px',
          backgroundColor: '#060606',
          padding: '8px 10px',
          border: '1px solid #1a1a1a',
          alignItems: 'center',
          maxWidth: '100%',
          boxSizing: 'border-box'
        }}>
          <div style={{ flexShrink: 1, minWidth: 0 }}>
            <span style={{ fontSize: '8px', color: '#888', display: 'block', letterSpacing: '0.5px', marginBottom: '2px', whiteSpace: 'nowrap' }}>
              DELIVERY CHARGE
            </span>
            <input
              type="number"
              value={isEditing ? deliveryCharge : initialDeliveryCharge}
              onChange={(e) => setDeliveryCharge(e.target.value)}
              disabled={!isEditing}
              placeholder={String(initialDeliveryCharge)}
              style={{
                backgroundColor: 'transparent',
                color: '#fff',
                border: 'none',
                outline: 'none',
                fontSize: '12px',
                fontWeight: 'bold',
                width: '100%',
                maxWidth: '60px',
                padding: '0',
                fontFamily: 'monospace',
                cursor: isEditing ? 'text' : 'default',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ borderLeft: '1px solid #1a1a1a', paddingLeft: '8px', flexShrink: 1, minWidth: 0 }}>
            <span style={{ fontSize: '8px', color: '#888', display: 'block', letterSpacing: '0.5px', marginBottom: '2px', whiteSpace: 'nowrap' }}>
              VAT RATE
            </span>
            <input
              type="number"
              step="0.01"
              value={isEditing ? vatRate : initialVatRate}
              onChange={(e) => setVatRate(e.target.value)}
              disabled={!isEditing}
              placeholder={String(initialVatRate)}
              style={{
                backgroundColor: 'transparent',
                color: '#fff',
                border: 'none',
                outline: 'none',
                fontSize: '12px',
                fontWeight: 'bold',
                width: '100%',
                maxWidth: '50px',
                padding: '0',
                fontFamily: 'monospace',
                cursor: isEditing ? 'text' : 'default',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ borderLeft: '1px solid #1a1a1a', paddingLeft: '8px', display: 'flex', gap: '4px', alignItems: 'center', flexShrink: 0 }}>
            {!isEditing ? (
              <button
                onClick={handleStartEdit}
                title="Edit Settings"
                style={{
                  backgroundColor: 'transparent',
                  color: '#888',
                  border: 'none',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>
            ) : (
              <>
                <button
                  onClick={handleSaveSettings}
                  disabled={isSaving}
                  title="Save Settings"
                  style={{
                    backgroundColor: 'transparent',
                    color: '#888',
                    border: '1px solid #333',
                    padding: '5px 6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    borderRadius: '2px'
                  }}
                >
                  {isSaving ? (
                    <span style={{ fontSize: '10px', fontFamily: 'monospace', color: '#888' }}>...</span>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>

                <button
                  onClick={handleCancel}
                  disabled={isSaving}
                  title="Cancel"
                  style={{
                    backgroundColor: 'transparent',
                    color: '#888',
                    border: '1px solid #333',
                    padding: '5px 6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    borderRadius: '2px'
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Return Reasons List Table */}
      {loading ? (
        <div style={{ fontSize: '11px', color: '#888', padding: '20px 0' }}>LOADING DATA...</div>
      ) : (
        <div style={{ overflowX: 'auto', border: '1px solid #1a1a1a', backgroundColor: '#060606' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '11px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1a1a1a', color: '#666', height: '40px' }}>
                <th style={{ padding: '0 16px' }}>ORDER ID</th>
                <th style={{ padding: '0 16px' }}>RETURN REASON</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid #111', height: '48px' }}>
                  <td style={{ padding: '0 16px', fontWeight: 'bold', color: '#fff' }}>
                    #{item.id.substring(0, 8)}
                  </td>
                  <td style={{ padding: '0 16px', color: item.return_reason ? '#e74c3c' : '#666' }}>
                    {item.return_reason || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
