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
  const [settingId, setSettingId] = useState<number | null>(null);

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
        setSettingId(data.id);
        setDeliveryCharge(data.delivery_charge ?? 100);
        setVatRate(data.vat_rate ?? 0.05);
      }
    } catch (err) {
      console.error('Error fetching store settings:', err);
    }
  };

  useEffect(() => {
    fetchShipments();
    fetchSettings();
  }, []);

  const updateSettingField = async (field: 'delivery_charge' | 'vat_rate', value: number) => {
    if (settingId === null) return;
    try {
      const { error } = await supabase
        .from('store_settings')
        .update({ [field]: value, updated_at: new Date().toISOString() })
        .eq('id', settingId);

      if (error) throw error;
      fetchSettings();
    } catch (err: any) {
      alert('Failed to update setting: ' + err.message);
    }
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
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'flex-start' }}>
        <div style={{ display: 'flex', gap: '24px', backgroundColor: '#060606', padding: '10px 16px', border: '1px solid #1a1a1a' }}>
          <div>
            <span style={{ fontSize: '9px', color: '#888', display: 'block', letterSpacing: '1px', marginBottom: '2px' }}>
              DELIVERY CHARGE
            </span>
            <input
              type="number"
              value={deliveryCharge}
              onChange={(e) => setDeliveryCharge(e.target.value)}
              onBlur={(e) => {
                if (e.target.value !== '') {
                  updateSettingField('delivery_charge', Number(e.target.value));
                }
              }}
              placeholder="100"
              style={{
                backgroundColor: 'transparent',
                color: '#fff',
                border: 'none',
                outline: 'none',
                fontSize: '13px',
                fontWeight: 'bold',
                width: '80px',
                padding: 0,
                fontFamily: 'monospace'
              }}
            />
          </div>
          <div style={{ borderLeft: '1px solid #1a1a1a', paddingLeft: '24px' }}>
            <span style={{ fontSize: '9px', color: '#888', display: 'block', letterSpacing: '1px', marginBottom: '2px' }}>
              VAT RATE
            </span>
            <input
              type="number"
              step="0.01"
              value={vatRate}
              onChange={(e) => setVatRate(e.target.value)}
              onBlur={(e) => {
                if (e.target.value !== '') {
                  updateSettingField('vat_rate', Number(e.target.value));
                }
              }}
              placeholder="0.05"
              style={{
                backgroundColor: 'transparent',
                color: '#fff',
                border: 'none',
                outline: 'none',
                fontSize: '13px',
                fontWeight: 'bold',
                width: '80px',
                padding: 0,
                fontFamily: 'monospace'
              }}
            />
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
