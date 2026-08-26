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

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      const targetId = settingId ?? 1;

      const { data, error } = await supabase
        .from('store_settings')
        .update({
          delivery_charge: Number(deliveryCharge),
          vat_rate: Number(vatRate),
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

      setInitialDeliveryCharge(deliveryCharge);
      setInitialVatRate(vatRate);
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

  const filteredShipments = shipments.filter((shipment) => {
    const matchesSearch =
      shipment.order_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shipment.tracking_number?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCourier = courierFilter === 'ALL' || shipment.courier_partner === courierFilter;
    return matchesSearch && matchesCourier;
  });

  return (
    <div style={{ color: '#fff', width: '100%' }}>
      {/* Store Settings Card */}
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'flex-start', width: '100%' }}>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          backgroundColor: '#060606',
          padding: '10px 12px',
          border: '1px solid #1a1a1a',
          alignItems: 'center',
          maxWidth: '100%',
          boxSizing: 'border-box'
        }}>
          <div>
            <span style={{ fontSize: '9px', color: '#888', display: 'block', letterSpacing: '1px', marginBottom: '2px' }}>
              DELIVERY CHARGE
            </span>
            <input
              type="number"
              value={deliveryCharge}
              onChange={(e) => setDeliveryCharge(e.target.value)}
              disabled={!isEditing}
              placeholder="100"
              style={{
                backgroundColor: 'transparent',
                color: isEditing ? '#fff' : '#888',
                border: isEditing ? '1px solid #333' : 'none',
                outline: 'none',
                fontSize: '13px',
                fontWeight: 'bold',
                width: '60px',
                padding: isEditing ? '2px 4px' : '0',
                fontFamily: 'monospace',
                cursor: isEditing ? 'text' : 'default'
              }}
            />
          </div>

          <div style={{ borderLeft: '1px solid #1a1a1a', paddingLeft: '12px' }}>
            <span style={{ fontSize: '9px', color: '#888', display: 'block', letterSpacing: '1px', marginBottom: '2px' }}>
              VAT RATE
            </span>
            <input
              type="number"
              step="0.01"
              value={vatRate}
              onChange={(e) => setVatRate(e.target.value)}
              disabled={!isEditing}
              placeholder="0.05"
              style={{
                backgroundColor: 'transparent',
                color: isEditing ? '#fff' : '#888',
                border: isEditing ? '1px solid #333' : 'none',
                outline: 'none',
                fontSize: '13px',
                fontWeight: 'bold',
                width: '55px',
                padding: isEditing ? '2px 4px' : '0',
                fontFamily: 'monospace',
                cursor: isEditing ? 'text' : 'default'
              }}
            />
          </div>

          <div style={{ borderLeft: '1px solid #1a1a1a', paddingLeft: '10px', display: 'flex', gap: '8px', alignItems: 'center' }}>
            {!isEditing ? (
              /* EDIT SVG ICON (Border removed) */
              <button
                onClick={() => setIsEditing(true)}
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
                {/* SAVE SVG ICON (White by default, Green when saving) */}
                <button
                  onClick={handleSaveSettings}
                  disabled={isSaving}
                  title="Save Settings"
                  style={{
                    backgroundColor: 'transparent',
                    color: isSaving ? '#2ecc71' : '#fff',
                    border: `1px solid ${isSaving ? '#2ecc71' : '#444'}`,
                    padding: '6px 8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    borderRadius: '2px'
                  }}
                >
                  {isSaving ? (
                    <span style={{ fontSize: '10px', fontFamily: 'monospace', color: '#2ecc71' }}>...</span>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>

                {/* CANCEL SVG ICON */}
                <button
                  onClick={handleCancel}
                  disabled={isSaving}
                  title="Cancel"
                  style={{
                    backgroundColor: 'transparent',
                    color: '#888',
                    border: '1px solid #333',
                    padding: '6px 8px',
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
                <th style={{ padding: '0 16px' }}>COURIER</th>
                <th style={{ padding: '0 16px' }}>DESTINATION</th>
                <th style={{ padding: '0 16px' }}>STATUS</th>
                <th style={{ padding: '0 16px', textAlign: 'right' }}>UPDATE</th>
              </tr>
            </thead>
            <tbody>
              {filteredShipments.map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid #111', height: '52px' }}>
                  <td style={{ padding: '0 16px' }}>
                    <div style={{ fontWeight: 'bold', color: '#fff' }}>#{item.order_id}</div>
                    <div style={{ fontSize: '10px', color: '#3498db' }}>TRK: {item.tracking_number || 'UNASSIGNED'}</div>
                  </td>
                  <td style={{ padding: '0 16px', color: '#bbb', fontWeight: 'bold' }}>
                    {item.courier_partner || 'STANDARD'}
                  </td>
                  <td style={{ padding: '0 16px', color: '#888' }}>
                    {item.destination || 'N/A'}
                  </td>
                  <td style={{ padding: '0 16px' }}>
                    <span
                      style={{
                        fontSize: '9px',
                        padding: '3px 6px',
                        borderRadius: '2px',
                        fontWeight: 'bold',
                        backgroundColor:
                          item.shipping_status === 'DELIVERED' ? '#112211' :
                          item.shipping_status === 'IN_TRANSIT' ? '#112233' : '#222211',
                        color:
                          item.shipping_status === 'DELIVERED' ? '#2ecc71' :
                          item.shipping_status === 'IN_TRANSIT' ? '#3498db' : '#f1c40f'
                      }}
                    >
                      {item.shipping_status}
                    </span>
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
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
