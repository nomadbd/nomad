import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';

interface AdminLogisticsProps {
  searchQuery?: string;
  isFilterOpen?: boolean;
}

interface Shipment {
  id: string;
  order_id: string;
  courier_partner: string;
  tracking_number: string;
  shipping_status: 'PENDING' | 'DISPATCHED' | 'IN_TRANSIT' | 'DELIVERED' | 'RETURNED';
  destination: string;
  updated_at: string;
  // Logistics specific fields
  cod_amount?: number;
  cod_status?: 'UNPAID' | 'SETTLED';
  courier_fee?: number;
  weight?: string;
  zone?: string;
  return_reason?: string;
}

export default function AdminLogistics({ searchQuery = '', isFilterOpen }: AdminLogisticsProps) {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [courierFilter, setCourierFilter] = useState<string>('ALL');

  const [deliveryCharge, setDeliveryCharge] = useState<number | string>('');
  const [vatRate, setVatRate] = useState<number | string>('');
  const [initialDeliveryCharge, setInitialDeliveryCharge] = useState<number | string>('');
  const [initialVatRate, setInitialVatRate] = useState<number | string>('');

  const [settingId, setSettingId] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const fetchShipments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('shipments')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setShipments(data || []);
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
    fetchShipments();
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

  const updateStatus = async (id: string, status: Shipment['shipping_status']) => {
    try {
      const { error } = await supabase
        .from('shipments')
        .update({ shipping_status: status, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      fetchShipments();
    } catch (err: any) {
      alert('Failed to update status: ' + err.message);
    }
  };

  const toggleCodStatus = async (id: string, currentStatus?: 'UNPAID' | 'SETTLED') => {
    const nextStatus = currentStatus === 'SETTLED' ? 'UNPAID' : 'SETTLED';
    try {
      const { error } = await supabase
        .from('shipments')
        .update({ cod_status: nextStatus, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      fetchShipments();
    } catch (err: any) {
      alert('Failed to update COD status: ' + err.message);
    }
  };

  const filteredShipments = shipments.filter((shipment) => {
    const matchesSearch =
      shipment.order_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shipment.tracking_number?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCourier = courierFilter === 'ALL' || shipment.courier_partner === courierFilter;
    return matchesSearch && matchesCourier;
  });

  // Logistics-Specific Metrics
  const pendingCodTotal = shipments
    .filter((s) => s.cod_status !== 'SETTLED' && s.shipping_status !== 'RETURNED')
    .reduce((sum, s) => sum + (s.cod_amount || 0), 0);

  const activeInTransit = shipments.filter(
    (s) => s.shipping_status === 'IN_TRANSIT' || s.shipping_status === 'DISPATCHED'
  ).length;

  const totalReturned = shipments.filter((s) => s.shipping_status === 'RETURNED').length;
  const returnRate = shipments.length > 0 ? ((totalReturned / shipments.length) * 100).toFixed(1) : '0';

  const getTrackingUrl = (courier: string, trk: string) => {
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
      {/* Settings Row */}
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

      {/* Logistics Specific Overview Metrics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
        gap: '8px',
        marginBottom: '20px'
      }}>
        <div style={{ backgroundColor: '#060606', border: '1px solid #1a1a1a', padding: '10px' }}>
          <span style={{ fontSize: '8px', color: '#888', letterSpacing: '0.5px', display: 'block' }}>PENDING COD</span>
          <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#2ecc71', fontFamily: 'monospace' }}>
            ৳{pendingCodTotal.toLocaleString()}
          </span>
        </div>

        <div style={{ backgroundColor: '#060606', border: '1px solid #1a1a1a', padding: '10px' }}>
          <span style={{ fontSize: '8px', color: '#888', letterSpacing: '0.5px', display: 'block' }}>IN-TRANSIT PARCELS</span>
          <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#3498db', fontFamily: 'monospace' }}>
            {activeInTransit} ITEMS
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
                <th style={{ padding: '0 16px' }}>COURIER & FEE</th>
                <th style={{ padding: '0 16px' }}>DESTINATION & COD</th>
                <th style={{ padding: '0 16px' }}>STATUS & RTO</th>
                <th style={{ padding: '0 16px', textAlign: 'right' }}>UPDATE</th>
              </tr>
            </thead>
            <tbody>
              {filteredShipments.map((item) => {
                const trackingUrl = getTrackingUrl(item.courier_partner, item.tracking_number);

                return (
                  <tr key={item.id} style={{ borderBottom: '1px solid #111', height: '58px' }}>
                    <td style={{ padding: '0 16px' }}>
                      <div style={{ fontWeight: 'bold', color: '#fff' }}>#{item.order_id}</div>
                      <div style={{ fontSize: '10px', color: '#3498db', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span>TRK: {item.tracking_number || 'UNASSIGNED'}</span>
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
                      <div style={{ fontSize: '9px', color: '#555', fontFamily: 'monospace' }}>
                        {item.zone || 'STD ZONE'} • {item.weight || '1.0kg'}
                      </div>
                    </td>

                    <td style={{ padding: '0 16px' }}>
                      <div style={{ color: '#bbb', fontWeight: 'bold' }}>{item.courier_partner || 'STANDARD'}</div>
                      <div style={{ fontSize: '10px', color: '#666', fontFamily: 'monospace' }}>
                        FEE: ৳{item.courier_fee ?? '--'}
                      </div>
                    </td>

                    <td style={{ padding: '0 16px' }}>
                      <div style={{ color: '#888' }}>{item.destination || 'N/A'}</div>
                      <div style={{ fontSize: '10px', color: '#aaa', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                        <span>COD: ৳{item.cod_amount ?? 0}</span>
                        <button
                          onClick={() => toggleCodStatus(item.id, item.cod_status)}
                          style={{
                            fontSize: '8px',
                            padding: '1px 4px',
                            borderRadius: '2px',
                            border: 'none',
                            cursor: 'pointer',
                            backgroundColor: item.cod_status === 'SETTLED' ? '#112211' : '#221111',
                            color: item.cod_status === 'SETTLED' ? '#2ecc71' : '#e74c3c'
                          }}
                        >
                          {item.cod_status === 'SETTLED' ? 'SETTLED' : 'UNPAID'}
                        </button>
                      </div>
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
                            item.shipping_status === 'DELIVERED' ? '#112211' :
                            item.shipping_status === 'IN_TRANSIT' ? '#112233' :
                            item.shipping_status === 'RETURNED' ? '#331111' : '#222211',
                          color:
                            item.shipping_status === 'DELIVERED' ? '#2ecc71' :
                            item.shipping_status === 'IN_TRANSIT' ? '#3498db' :
                            item.shipping_status === 'RETURNED' ? '#e74c3c' : '#f1c40f'
                        }}
                      >
                        {item.shipping_status}
                      </span>
                      {item.shipping_status === 'RETURNED' && item.return_reason && (
                        <div style={{ fontSize: '8px', color: '#e74c3c', marginTop: '2px' }}>
                          REASON: {item.return_reason}
                        </div>
                      )}
                    </td>

                    <td style={{ padding: '0 16px', textAlign: 'right' }}>
                      <select
                        value={item.shipping_status}
                        onChange={(e) => updateStatus(item.id, e.target.value as Shipment['shipping_status'])}
                        style={{ backgroundColor: '#111', color: '#fff', border: '1px solid #222', padding: '4px 8px', fontSize: '10px' }}
                      >
                        <option value="PENDING">PENDING</option>
                        <option value="DISPATCHED">DISPATCHED</option>
                        <option value="IN_TRANSIT">IN TRANSIT</option>
                        <option value="DELIVERED">DELIVERED</option>
                        <option value="RETURNED">RETURNED</option>
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
