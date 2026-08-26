import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';

interface OrderItemDetail {
  id: string;
  product_id?: string | null;
  product_name: string;
  quantity: number;
  size?: string | null;
  color?: string | null;
}

interface OrderItem {
  id: string;
  user_id?: string | null;
  courier_name?: string | null;
  return_reason?: string | null;
  return_status?: string | null;
  status?: string | null;
  created_at: string;
  order_items?: OrderItemDetail[];
}

export default function AdminLogistics() {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

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
        .select(`
          id,
          user_id,
          courier_name,
          return_reason,
          return_status,
          status,
          created_at,
          order_items (
            id,
            product_id,
            quantity,
            size,
            color,
            product_name
          )
        `)
        .eq('status', 'Cancelled')
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

  const toggleExpand = (id: string) => {
    setExpandedOrderId(expandedOrderId === id ? null : id);
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      const targetOrder = orders.find((o) => o.id === orderId);

      const { error } = await supabase
        .from('orders')
        .update({ return_status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      if (newStatus === 'Received' && targetOrder?.return_status !== 'Received') {
        if (targetOrder && targetOrder.order_items) {
          for (const item of targetOrder.order_items) {
            if (item.product_id) {
              const { data: prodData } = await supabase
                .from('products')
                .select('stock_quantity')
                .eq('id', item.product_id)
                .single();

              if (prodData) {
                const currentStock = prodData.stock_quantity || 0;
                await supabase
                  .from('products')
                  .update({ stock_quantity: currentStock + item.quantity })
                  .eq('id', item.product_id);
              }
            } else if (item.product_name) {
              const { data: prodData } = await supabase
                .from('products')
                .select('stock_quantity')
                .eq('name', item.product_name)
                .single();

              if (prodData) {
                const currentStock = prodData.stock_quantity || 0;
                await supabase
                  .from('products')
                  .update({ stock_quantity: currentStock + item.quantity })
                  .eq('name', item.product_name);
              }
            }
          }
        }
      }

      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === orderId ? { ...order, return_status: newStatus } : order
        )
      );
    } catch (err: any) {
      alert('Failed to update return status: ' + err.message);
    }
  };

  return (
    <div style={{ color: '#fff', width: '100%' }}>
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

      {loading ? (
        <div style={{ fontSize: '11px', color: '#888', padding: '20px 0' }}>LOADING DATA...</div>
      ) : (
        <div style={{ border: '1px solid #1a1a1a', backgroundColor: '#060606' }}>
          {orders.map((item) => {
            const isExpanded = expandedOrderId === item.id;
            const isReceived = item.return_status === 'Received';

            return (
              <div key={item.id} style={{ borderBottom: '1px solid #1a1a1a' }}>
                <div style={{ padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div 
                      onClick={() => toggleExpand(item.id)}
                      style={{ 
                        cursor: 'pointer', 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '6px',
                        marginBottom: '4px'
                      }}
                    >
                      <span style={{ fontWeight: 'bold', color: '#fff', fontSize: '13px' }}>
                        #{item.id.substring(0, 8)} ...
                      </span>
                      <span style={{ fontSize: '10px', color: '#888' }}>
                        {isExpanded ? '▲' : '▼'}
                      </span>
                    </div>

                    <div style={{ fontSize: '10px', color: '#666', fontFamily: 'monospace' }}>
                      {new Date(item.created_at).toLocaleString()}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-start', flexShrink: 0 }}>
                    <select
                      value={item.return_status || 'Pending'}
                      onChange={(e) => handleStatusUpdate(item.id, e.target.value)}
                      style={{
                        backgroundColor: '#111',
                        color: isReceived ? '#2ecc71' : '#f39c12',
                        border: '1px solid #222',
                        padding: '4px 8px',
                        fontSize: '10px',
                        borderRadius: '3px',
                        outline: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="Pending" style={{ color: '#f39c12' }}>Pending</option>
                      <option value="Received" style={{ color: '#2ecc71' }}>Received</option>
                    </select>
                  </div>

                </div>

                {isExpanded && (
                  <div style={{ backgroundColor: '#0a0a0a', borderTop: '1px solid #141414', padding: '16px 20px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>

                      <div style={{ borderRight: '1px solid #1a1a1a', paddingRight: '16px' }}>
                        <div style={{ fontSize: '10px', color: '#888', marginBottom: '8px', fontWeight: 'bold', letterSpacing: '0.5px' }}>
                          LOGISTICS DETAILS
                        </div>

                        <div style={{ marginBottom: '8px', fontSize: '11px', color: '#aaa' }}>
                          <span style={{ color: '#555' }}>Courier Name: </span>
                          <span style={{ color: '#fff', fontWeight: '500' }}>{item.courier_name || '—'}</span>
                        </div>

                        <div style={{ fontSize: '11px', color: '#aaa' }}>
                          <span style={{ color: '#555' }}>Return Reason: </span>
                          <span style={{ color: item.return_reason ? '#e74c3c' : '#888' }}>
                            {item.return_reason || '—'}
                          </span>
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: '10px', color: '#888', marginBottom: '8px', fontWeight: 'bold', letterSpacing: '0.5px' }}>
                          PRODUCTS LIST
                        </div>
                        {item.order_items && item.order_items.length > 0 ? (
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
                            <thead>
                              <tr style={{ color: '#555', borderBottom: '1px solid #1a1a1a', textAlign: 'left' }}>
                                <th style={{ paddingBottom: '4px' }}>PRODUCT NAME</th>
                                <th style={{ paddingBottom: '4px' }}>SIZE</th>
                                <th style={{ paddingBottom: '4px' }}>COLOR</th>
                                <th style={{ paddingBottom: '4px' }}>QTY</th>
                              </tr>
                            </thead>
                            <tbody>
                              {item.order_items.map((prod) => (
                                <tr key={prod.id} style={{ borderBottom: '1px solid #141414', color: '#ccc' }}>
                                  <td style={{ padding: '6px 0' }}>{prod.product_name}</td>
                                  <td style={{ padding: '6px 0', color: '#888' }}>{prod.size || '—'}</td>
                                  <td style={{ padding: '6px 0', color: '#888' }}>{prod.color || '—'}</td>
                                  <td style={{ padding: '6px 0', fontWeight: 'bold', color: '#fff' }}>{prod.quantity}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : (
                          <div style={{ fontSize: '10px', color: '#555' }}>No product details found for this order.</div>
                        )}
                      </div>

                    </div>
                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
