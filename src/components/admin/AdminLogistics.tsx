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
  courier_fee?: number | null;
  weight?: number | null;
  return_reason?: string | null;
  created_at: string;
}

export default function AdminLogistics({ searchQuery = '', isFilterOpen }: AdminLogisticsProps) {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [courierFilter, setCourierFilter] = useState<string>('ALL');

  // Edit State for Logistics Data
  const [editingId, setEditingId] = useState<string | null>(null);
  const [courierName, setCourierName] = useState<string>('');
  const [trackingId, setTrackingId] = useState<string>('');
  const [weight, setWeight] = useState<string>('');
  const [courierFee, setCourierFee] = useState<string>('');
  const [returnReason, setReturnReason] = useState<string>('');
  const [isSavingRow, setIsSavingRow] = useState<boolean>(false);

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

  useEffect(() => {
    fetchLogisticsOrders();
  }, []);

  const handleStartEditRow = (item: OrderItem) => {
    setEditingId(item.id);
    setCourierName(item.courier_name || '');
    setTrackingId(item.tracking_id || '');
    setWeight(item.weight ? String(item.weight) : '');
    setCourierFee(item.courier_fee ? String(item.courier_fee) : '');
    setReturnReason(item.return_reason || '');
  };

  const handleSaveLogistics = async (id: string) => {
    setIsSavingRow(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          courier_name: courierName || null,
          tracking_id: trackingId || null,
          weight: weight ? parseFloat(weight) : null,
          courier_fee: courierFee ? parseFloat(courierFee) : 0,
          return_reason: returnReason || null
        })
        .eq('id', id);

      if (error) throw error;
      setEditingId(null);
      fetchLogisticsOrders();
    } catch (err: any) {
      alert('Failed to save logistics data: ' + err.message);
    } finally {
      setIsSavingRow(false);
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
      {/* Overview Cards (Pure Logistics) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
        gap: '8px',
        marginBottom: '20px'
      }}>
        <div style={{ backgroundColor: '#060606', border: '1px solid #1a1a1a', padding: '10px' }}>
          <span style={{ fontSize: '8px', color: '#888', letterSpacing: '0.5px', display: 'block' }}>TOTAL PARCELS</span>
          <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff', fontFamily: 'monospace' }}>
            {orders.length}
          </span>
        </div>

        <div style={{ backgroundColor: '#060606', border: '1px solid #1a1a1a', padding: '10px' }}>
          <span style={{ fontSize: '8px', color: '#888', letterSpacing: '0.5px', display: 'block' }}>TOTAL COURIER COST</span>
          <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#e74c3c', fontFamily: 'monospace' }}>
            ৳{orders.reduce((sum, o) => sum + (o.courier_fee || 0), 0).toLocaleString()}
          </span>
        </div>

        <div style={{ backgroundColor: '#060606', border: '1px solid #1a1a1a', padding: '10px' }}>
          <span style={{ fontSize: '8px', color: '#888', letterSpacing: '0.5px', display: 'block' }}>RETURNED PARCELS</span>
          <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#f1c40f', fontFamily: 'monospace' }}>
            {orders.filter((o) => o.status === 'Returned' || o.status === 'Cancelled').length}
          </span>
        </div>
      </div>

      {isFilterOpen && (
        <div style={{ backgroundColor: '#0a0a0a', border: '1px solid #1f1f1f', padding: '12px', marginBottom: '20px' }}>
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
                <th style={{ padding: '0 16px' }}>ORDER ID & ADDR</th>
                <th style={{ padding: '0 16px' }}>ORDER STATUS</th>
                <th style={{ padding: '0 16px' }}>COURIER & TRK ID</th>
                <th style={{ padding: '0 16px' }}>WEIGHT & FEE</th>
                <th style={{ padding: '0 16px' }}>RETURN REASON</th>
                <th style={{ padding: '0 16px', textAlign: 'right' }}>LOGISTICS ACTION</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((item) => {
                const isEditingThis = editingId === item.id;
                const trackingUrl = getTrackingUrl(item.courier_name, item.tracking_id);

                return (
                  <tr key={item.id} style={{ borderBottom: '1px solid #111', height: '62px' }}>
                    {/* Order ID & Customer Info */}
                    <td style={{ padding: '0 16px' }}>
                      <div style={{ fontWeight: 'bold', color: '#fff' }}>#{item.id.substring(0, 8)}</div>
                      <div style={{ fontSize: '10px', color: '#aaa' }}>{item.customer_name || 'N/A'}</div>
                      <div style={{ fontSize: '9px', color: '#666', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.shipping_address}
                      </div>
                    </td>

                    {/* Read-Only Statuses */}
                    <td style={{ padding: '0 16px' }}>
                      <div style={{
                        fontSize: '9px',
                        padding: '2px 6px',
                        borderRadius: '2px',
                        fontWeight: 'bold',
                        display: 'inline-block',
                        backgroundColor:
                          item.status === 'Delivered' ? '#112211' :
                          item.status === 'Shipped' || item.status === 'In Transit' ? '#112233' :
                          item.status === 'Cancelled' ? '#331111' : '#222211',
                        color:
                          item.status === 'Delivered' ? '#2ecc71' :
                          item.status === 'Shipped' || item.status === 'In Transit' ? '#3498db' :
                          item.status === 'Cancelled' ? '#e74c3c' : '#f1c40f'
                      }}>
                        {item.status}
                      </div>
                      <div style={{ fontSize: '9px', color: '#666', marginTop: '2px' }}>
                        PAYMENT: <span style={{ color: item.payment_status === 'Paid' ? '#2ecc71' : '#f1c40f' }}>{item.payment_status || 'Unpaid'}</span>
                      </div>
                    </td>

                    {/* Courier Name & Tracking ID */}
                    <td style={{ padding: '0 16px' }}>
                      {isEditingThis ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <input
                            type="text"
                            placeholder="Courier Name"
                            value={courierName}
                            onChange={(e) => setCourierName(e.target.value)}
                            style={{ backgroundColor: '#111', border: '1px solid #333', color: '#fff', fontSize: '10px', padding: '2px 4px' }}
                          />
                          <input
                            type="text"
                            placeholder="Tracking ID"
                            value={trackingId}
                            onChange={(e) => setTrackingId(e.target.value)}
                            style={{ backgroundColor: '#111', border: '1px solid #333', color: '#fff', fontSize: '10px', padding: '2px 4px' }}
                          />
                        </div>
                      ) : (
                        <div>
                          <div style={{ fontWeight: 'bold', color: '#bbb' }}>{item.courier_name || 'NOT ASSIGNED'}</div>
                          <div style={{ fontSize: '10px', color: '#3498db', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span>TRK: {item.tracking_id || 'N/A'}</span>
                            {trackingUrl && (
                              <a href={trackingUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#3498db' }}>
                                ↗
                              </a>
                            )}
                          </div>
                        </div>
                      )}
                    </td>

                    {/* Weight & Courier Fee */}
                    <td style={{ padding: '0 16px' }}>
                      {isEditingThis ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="Weight (kg)"
                            value={weight}
                            onChange={(e) => setWeight(e.target.value)}
                            style={{ backgroundColor: '#111', border: '1px solid #333', color: '#fff', fontSize: '10px', padding: '2px 4px', width: '70px' }}
                          />
                          <input
                            type="number"
                            placeholder="Fee (৳)"
                            value={courierFee}
                            onChange={(e) => setCourierFee(e.target.value)}
                            style={{ backgroundColor: '#111', border: '1px solid #333', color: '#fff', fontSize: '10px', padding: '2px 4px', width: '70px' }}
                          />
                        </div>
                      ) : (
                        <div>
                          <div style={{ color: '#aaa' }}>{item.weight ? `${item.weight} kg` : 'Weight: N/A'}</div>
                          <div style={{ fontSize: '10px', color: '#e74c3c', fontFamily: 'monospace' }}>
                            FEE: ৳{item.courier_fee ?? 0}
                          </div>
                        </div>
                      )}
                    </td>

                    {/* Return Reason */}
                    <td style={{ padding: '0 16px' }}>
                      {isEditingThis ? (
                        <input
                          type="text"
                          placeholder="Reason if returned"
                          value={returnReason}
                          onChange={(e) => setReturnReason(e.target.value)}
                          style={{ backgroundColor: '#111', border: '1px solid #333', color: '#fff', fontSize: '10px', padding: '2px 4px', width: '100px' }}
                        />
                      ) : (
                        <div style={{ fontSize: '10px', color: item.return_reason ? '#e74c3c' : '#666' }}>
                          {item.return_reason || '—'}
                        </div>
                      )}
                    </td>

                    {/* Action Button */}
                    <td style={{ padding: '0 16px', textAlign: 'right' }}>
                      {isEditingThis ? (
                        <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => handleSaveLogistics(item.id)}
                            disabled={isSavingRow}
                            style={{ backgroundColor: '#2ecc71', color: '#000', border: 'none', padding: '4px 8px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer' }}
                          >
                            {isSavingRow ? '...' : 'SAVE'}
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            style={{ backgroundColor: '#333', color: '#fff', border: 'none', padding: '4px 8px', fontSize: '10px', cursor: 'pointer' }}
                          >
                            X
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleStartEditRow(item)}
                          style={{ backgroundColor: 'transparent', color: '#3498db', border: '1px solid #1a2a3a', padding: '4px 8px', fontSize: '10px', cursor: 'pointer' }}
                        >
                          EDIT LOGISTICS
                        </button>
                      )}
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
