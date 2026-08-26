 import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';

interface AdminLogisticsProps {
  searchQuery?: string;
  isFilterOpen?: boolean;
}

interface OrderItem {
  id: string;
  customer_name: string;
  shipping_address: string;
  courier_name: string | null;
  tracking_id: string | null;
  status: string;
  total_amount: number;
  payment_status: string;
  delivery_charge: number;
  courier_fee?: number;
  weight?: string;
  return_reason?: string;
  created_at: string;
}

export default function AdminLogistics({ searchQuery = '', isFilterOpen }: AdminLogisticsProps) {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [courierFilter, setCourierFilter] = useState<string>('ALL');

  const [deliveryCharge, setDeliveryCharge] = useState<number | string>('');
  const [vatRate, setVatRate] = useState<number | string>('');
  const [initialDeliveryCharge, setInitialDeliveryCharge] = useState<number | string>('');
  const [initialVatRate, setInitialVatRate] = useState<number | string>('');

  const [settingId, setSettingId] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const fetchLogisticsOrders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error('Error fetching logistics data:', err);
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
    fetchLogisticsOrders();
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
        alert('Update failed: RLS Policy is blocking or ID is invalid in Supabase!');
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

  const updateOrderStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
      fetchLogisticsOrders();
    } catch (err: any) {
      alert('Failed to update status: ' + err.message);
    }
  };

  const updatePaymentStatus = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'Paid' ? 'Unpaid / COD' : 'Paid';
    try {
      const { error } = await supabase
        .from('orders')
        .update({ payment_status: nextStatus })
        .eq('id', id);

      if (error) throw error;
      fetchLogisticsOrders();
    } catch (err: any) {
      alert('Failed to update payment status: ' + err.message);
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.tracking_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCourier =
      courierFilter === 'ALL' ||
      order.courier_name?.toUpperCase() === courierFilter.toUpperCase();
    return matchesSearch && matchesCourier;
  });

  // Overview Metrics Calculations
  const pendingCodTotal = orders
    .filter((o) => o.payment_status !== 'Paid' && o.status !== 'Cancelled' && o.status !== 'Returned')
    .reduce((sum, o) => sum + (o.total_amount || 0), 0);

  const activeInTransit = orders.filter(
    (o) => o.status === 'Shipped' || o.status === 'In Transit' || o.status === 'Processing'
  ).length;

  const totalReturned = orders.filter((o) => o.status === 'Returned').length;
  const returnRate = orders.length > 0 ? ((totalReturned / orders.length) * 100).toFixed(1) : '0';

  const getTrackingUrl = (courier: string | null, trk: string | null) => {
    if (!trk) return null;
    const c = courier?.toUpperCase() || '';
    if (c.includes('PATHAO')) return `https://pathao.com/courier/tracking/?consignment_id=${trk}`;
    if (c.includes('STEADFAST')) return `https://steadfast.com.bd/t/${trk}`;
    if (c.includes('REDX')) return `https://redx.com.bd/track-parcel?trackingId=${trk}`;
    if (c.includes('DHL')) return `https://www.dhl.com/en/express/tracking.html?AWB=${trk}`;
    return null;
  };

  return (
    <div style={{ color: '#fff', width: '100%' }}>
      {/* Settings Bar */}
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'flex-start', width: '100%' }}>
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
                maxWidth: '50px',
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
                maxWidth: '40px',
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

      {/* Overview Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
        gap: '8px',
        marginBottom: '20px'
      }}>
        <div style={{ backgroundColor: '#060606', border: '1px solid #1a1a1a', padding: '10px' }}>
          <span style={{ fontSize: '8px', color: '#888', letterSpacing: '0.5px', display: 'block' }}>PENDING COD COLLECTION</span>
          <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#2ecc71', fontFamily: 'monospace' }}>
            ৳{pendingCodTotal.toLocaleString()}
          </span>
        </div>

        <div style={{ backgroundColor: '#060606', border: '1px solid #1a1a1a', padding: '10px' }}>
          <span style={{ fontSize: '8px', color: '#888', letterSpacing: '0.5px', display: 'block' }}>IN-TRANSIT / PROCESSING</span>
          <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#3498db', fontFamily: 'monospace' }}>
            {activeInTransit} ORDERS
          </span>
        </div>

        <div style={{ backgroundColor: '#060606', border: '1px solid #1a1a1a', padding: '10px' }}>
          <span style={{ fontSize: '8px', color: '#888', letterSpacing: '0.5px', display: 'block' }}>RETURN RATE (RTO)</span>
          <span style={{ fontSize: '13px', fontWeight: 'bold', color: Number(returnRate) > 5 ? '#e74c3c' : '#f1c40f', fontFamily: 'monospace' }}>
            {returnRate}% ({totalReturned})
          </span>
        </div>
      </div>

      {isFilterOpen && (
        <div style={{ backgroundColor: '#0a0a0a', border: '1px solid #1f1f1f', padding: '12px', marginBottom: '20px', display: 'flex', gap: '12px' }}>
          <select
            value={courierFilter}
            onChange={(e) => setCourierFilter(e.target.value)}
            style={{ backgroundColor: '#111', color: '#fff', border: '1px solid #222', padding: '8px 12px', fontSize: '11px' }}
          >
            <option value="ALL">ALL COURIERS</option>
            <option value="PATHAO">PATHAO</option>
            <option value="STEADFAST">STEADFAST</option>
            <option value="REDX">REDX</option>
            <option value="DHL">DHL</option>
          </select>
        </div>
      )}

      {loading ? (
        <div style={{ fontSize: '11px', color: '#888', padding: '20px 0' }}>LOADING LOGISTICS DATA...</div>
      ) : (
        <div style={{ overflowX: 'auto', border: '1px solid #1a1a1a', backgroundColor: '#060606' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '11px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1a1a1a', color: '#666', height: '40px' }}>
                <th style={{ padding: '0 16px' }}>ORDER / TRACKING</th>
                <th style={{ padding: '0 16px' }}>CUSTOMER & ADDRESS</th>
                <th style={{ padding: '0 16px' }}>COURIER & FEE</th>
                <th style={{ padding: '0 16px' }}>COD / PAYMENT</th>
                <th style={{ padding: '0 16px' }}>STATUS</th>
                <th style={{ padding: '0 16px', textAlign: 'right' }}>UPDATE STATUS</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((item) => {
                const trackingUrl = getTrackingUrl(item.courier_name, item.tracking_id);

                return (
                  <tr key={item.id} style={{ borderBottom: '1px solid #111', height: '58px' }}>
                    <td style={{ padding: '0 16px' }}>
                      <div style={{ fontWeight: 'bold', color: '#fff' }}>#{item.id.substring(0, 8)}</div>
                      <div style={{ fontSize: '10px', color: '#3498db', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span>TRK: {item.tracking_id || 'UNASSIGNED'}</span>
                        {trackingUrl && (
                          <a
                            href={trackingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Live Track"
                            style={{ color: '#3498db', display: 'inline-flex', alignItems: 'center' }}
                          >
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                              <polyline points="15 3 21 3 21 9" />
                              <line x1="10" y1="14" x2="21" y2="3" />
                            </svg>
                          </a>
                        )}
                      </div>
                    </td>

                    <td style={{ padding: '0 16px' }}>
                      <div style={{ color: '#fff', fontWeight: 'bold' }}>{item.customer_name || 'N/A'}</div>
                      <div style={{ fontSize: '10px', color: '#888', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.shipping_address || 'No Address'}
                      </div>
                    </td>

                    <td style={{ padding: '0 16px' }}>
                      <div style={{ color: '#bbb', fontWeight: 'bold' }}>{item.courier_name || 'UNASSIGNED'}</div>
                      <div style={{ fontSize: '10px', color: '#666', fontFamily: 'monospace' }}>
                        FEE: ৳{item.courier_fee ?? 0}
                      </div>
                    </td>

                    <td style={{ padding: '0 16px' }}>
                      <div style={{ color: '#aaa', fontWeight: 'bold' }}>৳{item.total_amount}</div>
                      <button
                        onClick={() => updatePaymentStatus(item.id, item.payment_status)}
                        style={{
                          fontSize: '8px',
                          padding: '1px 5px',
                          borderRadius: '2px',
                          border: 'none',
                          cursor: 'pointer',
                          marginTop: '2px',
                          backgroundColor: item.payment_status === 'Paid' ? '#112211' : '#221111',
                          color: item.payment_status === 'Paid' ? '#2ecc71' : '#e74c3c'
                        }}
                      >
                        {item.payment_status || 'Unpaid / COD'}
                      </button>
                    </td>

                    <td style={{ padding: '0 16px' }}>
                      <span
                        style={{
                          fontSize: '9px',
                          padding: '3px 6px',
                          borderRadius: '2px',
                          fontWeight: 'bold',
                          display: 'inline-block',
                          backgroundColor:
                            item.status === 'Delivered' ? '#112211' :
                            item.status === 'Shipped' || item.status === 'In Transit' ? '#112233' :
                            item.status === 'Cancelled' || item.status === 'Returned' ? '#331111' : '#222211',
                          color:
                            item.status === 'Delivered' ? '#2ecc71' :
                            item.status === 'Shipped' || item.status === 'In Transit' ? '#3498db' :
                            item.status === 'Cancelled' || item.status === 'Returned' ? '#e74c3c' : '#f1c40f'
                        }}
                      >
                        {item.status}
                      </span>
                    </td>

                    <td style={{ padding: '0 16px', textAlign: 'right' }}>
                      <select
                        value={item.status || 'Pending'}
                        onChange={(e) => updateOrderStatus(item.id, e.target.value)}
                        style={{ backgroundColor: '#111', color: '#fff', border: '1px solid #222', padding: '4px 8px', fontSize: '10px' }}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Received">Received</option>
                        <option value="Processing">Processing</option>
                        <option value="Shipped">Shipped</option>
                        <option value="In Transit">In Transit</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Returned">Returned</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
