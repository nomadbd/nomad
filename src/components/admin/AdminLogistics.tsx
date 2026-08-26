import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';

interface OrderItemDetail {
  id: string;
  order_id: string;
  product_name: string;
  quantity: number;
  size?: string | null;
  color?: string | null;
}

interface OrderItem {
  id: string;
  user_id?: string | null;
  courier_name?: string | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  customer_email?: string | null;
  shipping_address?: string | null;
  return_reason?: string | null;
  return_status?: string | null;
  total_price?: number | null;
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
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('id, user_id, courier_name, customer_name, customer_phone, customer_email, shipping_address, return_reason, return_status, total_price, created_at')
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      if (!ordersData || ordersData.length === 0) {
        setOrders([]);
        return;
      }

      const orderIds = ordersData.map((order) => order.id);

      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select('id, order_id, quantity, size, color, product_name')
        .in('order_id', orderIds);

      if (itemsError) console.error('Error fetching order items:', itemsError);

      const combinedOrders = ordersData.map((order) => ({
        ...order,
        order_items: (itemsData || []).filter((item) => item.order_id === order.id)
      }));

      setOrders(combinedOrders);
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
      const { error } = await supabase
        .from('orders')
        .update({ return_status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === orderId ? { ...order, return_status: newStatus } : order
        )
      );
    } catch (err: any) {
      alert('Failed to update return status: ' + err.message);
    }
  };

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    const formattedDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const formattedTime = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    return `${formattedDate}, ${formattedTime}`;
  };

  return (
    <div style={{ color: '#fff', width: '100%', fontFamily: 'sans-serif' }}>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
          {orders.map((item) => {
            const isExpanded = expandedOrderId === item.id;
            const isReceived = item.return_status === 'Received';
            const itemQty = item.order_items?.reduce((sum, i) => sum + (i.quantity || 0), 0) || 0;

            return (
              <div
                key={item.id}
                style={{
                  backgroundColor: '#060606',
                  border: '1px solid #1a1a1a',
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}
              >
                <div
                  onClick={() => toggleExpand(item.id)}
                  style={{
                    padding: '12px 16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '1px solid #333',
                      borderRadius: '3px',
                      flexShrink: 0
                    }} />

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '16px', fontWeight: 'bold', fontFamily: 'monospace', color: '#fff', letterSpacing: '0.5px' }}>
                          #{item.id.substring(0, 8)}...
                        </span>
                        <span style={{ fontSize: '10px', color: '#888' }}>
                          {isExpanded ? '▼' : '►'}
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#888', fontFamily: 'monospace', marginTop: '4px' }}>
                        {formatDate(item.created_at)}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#fff' }}>
                        ৳{item.total_price ?? 0}
                      </div>
                      <div style={{ fontSize: '10px', color: '#888', fontFamily: 'monospace', marginTop: '2px', letterSpacing: '0.5px' }}>
                        {itemQty} ITEM(S)
                      </div>
                    </div>

                    <div onClick={(e) => e.stopPropagation()}>
                      <select
                        value={item.return_status || 'Pending'}
                        onChange={(e) => handleStatusUpdate(item.id, e.target.value)}
                        style={{
                          backgroundColor: '#111',
                          color: isReceived ? '#2ecc71' : '#f39c12',
                          border: '1px solid #222',
                          padding: '6px 10px',
                          fontSize: '11px',
                          borderRadius: '3px',
                          outline: 'none',
                          cursor: 'pointer',
                          fontWeight: 'bold'
                        }}
                      >
                        <option value="Pending" style={{ color: '#f39c12' }}>Pending</option>
                        <option value="Received" style={{ color: '#2ecc71' }}>Received</option>
                      </select>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div style={{
                    borderTop: '1px solid #1a1a1a',
                    backgroundColor: '#000000',
                    padding: '16px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px'
                  }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span>{item.customer_name || 'N/A'}</span>
                        <span style={{ fontSize: '13px', color: '#888', fontWeight: 'normal', fontFamily: 'monospace' }}>
                          {item.customer_phone || ''}
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#aaa', marginTop: '6px', fontFamily: 'monospace' }}>
                        • {item.customer_email || 'No Email'}
                      </div>
                      <div style={{ fontSize: '12px', color: '#ccc', marginTop: '4px' }}>
                        {item.shipping_address || 'No Address Provided'}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '30px', borderTop: '1px solid #111', paddingTop: '12px' }}>
                      <div>
                        <span style={{ fontSize: '10px', color: '#666', display: 'block', letterSpacing: '0.5px', marginBottom: '2px' }}>
                          COURIER NAME
                        </span>
                        <span style={{ fontSize: '12px', color: '#fff', fontWeight: 'bold' }}>
                          {item.courier_name || '—'}
                        </span>
                      </div>

                      <div>
                        <span style={{ fontSize: '10px', color: '#666', display: 'block', letterSpacing: '0.5px', marginBottom: '2px' }}>
                          RETURN REASON
                        </span>
                        <span style={{ fontSize: '12px', color: item.return_reason ? '#e74c3c' : '#888' }}>
                          {item.return_reason || '—'}
                        </span>
                      </div>
                    </div>

                    <div style={{ borderTop: '1px solid #111', paddingTop: '12px' }}>
                      <div style={{ fontSize: '10px', color: '#666', letterSpacing: '0.5px', marginBottom: '8px', fontWeight: 'bold' }}>
                        ORDERED PRODUCTS
                      </div>
                      {item.order_items && item.order_items.length > 0 ? (
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                          <thead>
                            <tr style={{ color: '#555', borderBottom: '1px solid #1a1a1a', textAlign: 'left', height: '28px' }}>
                              <th>PRODUCT NAME</th>
                              <th>SIZE</th>
                              <th>COLOR</th>
                              <th>QTY</th>
                            </tr>
                          </thead>
                          <tbody>
                            {item.order_items.map((prod) => (
                              <tr key={prod.id} style={{ borderBottom: '1px solid #111', height: '32px', color: '#ccc' }}>
                                <td>{prod.product_name}</td>
                                <td style={{ color: '#888' }}>{prod.size || '—'}</td>
                                <td style={{ color: '#888' }}>{prod.color || '—'}</td>
                                <td style={{ fontWeight: 'bold', color: '#fff' }}>{prod.quantity}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <div style={{ fontSize: '11px', color: '#555' }}>No products found for this order.</div>
                      )}
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
