import { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';

export interface OrderItemDetail {
  id: string;
  order_id?: string | null;
  product_id?: string | null;
  product_name?: string | null;
  quantity: number;
  size?: string | null;
  color?: string | null;
}

export interface OrderItem {
  id: string;
  user_id?: string | null;
  courier_name?: string | null;
  return_reason?: string | null;
  admin_notes?: string | null;
  return_status?: string | null;
  status?: string | null;
  created_at: string;
  order_items?: OrderItemDetail[];
}

export function useAdminLogistics() {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [selectedStatuses, setSelectedStatuses] = useState<{ [key: string]: string }>({});
  const [logisticsNotes, setLogisticsNotes] = useState<{ [key: string]: string }>({});
  const [savingOrderId, setSavingOrderId] = useState<string | null>(null);

  const [deliveryCharge, setDeliveryCharge] = useState<number | string>('');
  const [vatRate, setVatRate] = useState<number | string>('');
  const [initialDeliveryCharge, setInitialDeliveryCharge] = useState<number | string>('100');
  const [initialVatRate, setInitialVatRate] = useState<number | string>('0.05');
  const [settingId, setSettingId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('status', 'Cancelled')
        .not('courier_name', 'is', null)
        .neq('courier_name', '')
        .order('created_at', { ascending: false });

      if (orderError) throw orderError;

      if (!orderData || orderData.length === 0) {
        setOrders([]);
        return;
      }

      const orderIds = orderData.map((o) => o.id);

      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select('*')
        .in('order_id', orderIds);

      if (itemsError) {
        console.error('Error fetching order items:', itemsError);
      }

      const initialNotes: { [key: string]: string } = {};
      orderData.forEach((ord) => {
        initialNotes[ord.id] = ord.admin_notes || '';
      });
      setLogisticsNotes(initialNotes);

      const combinedOrders: OrderItem[] = orderData.map((ord) => {
        const matchedItems = (itemsData || []).filter((item) => item.order_id === ord.id);
        return {
          ...ord,
          order_items: matchedItems,
        };
      });

      setOrders(combinedOrders);
    } catch (err) {
      console.error('Error fetching logistics orders:', err);
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

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      const finalDc = deliveryCharge === '' ? initialDeliveryCharge : deliveryCharge;
      const finalVat = vatRate === '' ? initialVatRate : vatRate;

      let error;
      if (settingId) {
        const res = await supabase
          .from('store_settings')
          .update({
            delivery_charge: Number(finalDc),
            vat_rate: Number(finalVat),
            updated_at: new Date().toISOString(),
          })
          .eq('id', settingId)
          .select();
        error = res.error;
        if (!error && (!res.data || res.data.length === 0)) {
          const insertRes = await supabase
            .from('store_settings')
            .insert({
              delivery_charge: Number(finalDc),
              vat_rate: Number(finalVat),
              updated_at: new Date().toISOString(),
            })
            .select();
          error = insertRes.error;
          if (!error && insertRes.data && insertRes.data.length > 0) {
            setSettingId(insertRes.data[0].id);
          }
        }
      } else {
        const res = await supabase
          .from('store_settings')
          .insert({
            delivery_charge: Number(finalDc),
            vat_rate: Number(finalVat),
            updated_at: new Date().toISOString(),
          })
          .select();
        error = res.error;
        if (!error && res.data && res.data.length > 0) {
          setSettingId(res.data[0].id);
        }
      }

      if (error) throw error;

      // বর্তমান লগইন করা ইউজারের তথ্য এবং profiles টেবিল থেকে নাম ও পদবী বের করা
      try {
        const { data: { user } } = await supabase.auth.getUser();
        let profileInfo = { name: 'Admin', designation: 'Admin', email: user?.email || '' };

        if (user) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('name, designation, email')
            .eq('id', user.id)
            .maybeSingle();

          if (profileData) {
            profileInfo = {
              name: profileData.name || user.email || 'Admin',
              designation: profileData.designation || 'Admin',
              email: profileData.email || user.email || ''
            };
          }
        }

        // audit_logs টেবিলে metadata-র মধ্যে ইউজারের তথ্য সেভ করা (user_id কলাম ছাড়া)
        const { error: auditError } = await supabase.from('audit_logs').insert({
          entity_type: 'store_settings',
          action_type: 'UPDATE_LOGISTICS_SETTINGS',
          changes: {
            delivery_charge: { old: initialDeliveryCharge, new: finalDc },
            vat_rate: { old: initialVatRate, new: finalVat },
          },
          metadata: profileInfo, // নাম, পদবী ও ইমেইল এখানে সেভ হচ্ছে
          created_at: new Date().toISOString(),
        });

        if (auditError) {
          console.error('Audit Log Error:', auditError.message);
        }
      } catch (auditErr: any) {
        console.error('Audit log insert failed:', auditErr.message);
      }

      setInitialDeliveryCharge(finalDc);
      setInitialVatRate(finalVat);
      setDeliveryCharge(finalDc);
      setVatRate(finalVat);
    } catch (err: any) {
      console.error('Failed to save settings: ', err.message);
      handleCancel();
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setDeliveryCharge(initialDeliveryCharge);
    setVatRate(initialVatRate);
  };

  const toggleExpand = (id: string) => {
    setExpandedOrderId(expandedOrderId === id ? null : id);
  };

  const handleSelectStatus = (orderId: string, status: string) => {
    setSelectedStatuses((prev) => ({
      ...prev,
      [orderId]: status,
    }));
  };

  const handleNoteChange = (orderId: string, note: string) => {
    setLogisticsNotes((prev) => ({
      ...prev,
      [orderId]: note,
    }));
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    setSavingOrderId(orderId);
    try {
      const { data: freshOrderData, error: freshOrderErr } = await supabase
        .from('orders')
        .select('id, return_status')
        .eq('id', orderId)
        .maybeSingle();

      if (freshOrderErr || !freshOrderData) throw new Error('Order not found');

      const currentReturnStatus = freshOrderData.return_status || 'Pending';
      const updatedNote = logisticsNotes[orderId] || '';

      const { data: currentOrderItems, error: itemsFetchError } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderId);

      if (itemsFetchError) throw itemsFetchError;
      const itemsToProcess = currentOrderItems || [];

      if (newStatus === 'Received' && currentReturnStatus !== 'Received') {
        for (const item of itemsToProcess) {
          const qty = Number(item.quantity) || 0;
          if (item.product_id && qty > 0) {
            const { data: prodData, error: prodErr } = await supabase
              .from('products')
              .select('id, stock_quantity')
              .eq('id', item.product_id)
              .maybeSingle();

            if (!prodErr && prodData) {
              const currentStock = Number(prodData.stock_quantity) || 0;
              const updatedStock = currentStock + qty;

              await supabase
                .from('products')
                .update({ stock_quantity: updatedStock })
                .eq('id', item.product_id);
            }
          }
        }
      } else if (currentReturnStatus === 'Received' && newStatus !== 'Received') {
        for (const item of itemsToProcess) {
          const qty = Number(item.quantity) || 0;
          if (item.product_id && qty > 0) {
            const { data: prodData, error: prodErr } = await supabase
              .from('products')
              .select('id, stock_quantity')
              .eq('id', item.product_id)
              .maybeSingle();

            if (!prodErr && prodData) {
              const currentStock = Number(prodData.stock_quantity) || 0;
              const updatedStock = Math.max(0, currentStock - qty);

              await supabase
                .from('products')
                .update({ stock_quantity: updatedStock })
                .eq('id', item.product_id);
            }
          }
        }
      }

      const { error: updateOrderError } = await supabase
        .from('orders')
        .update({
          return_status: newStatus,
          admin_notes: updatedNote,
        })
        .eq('id', orderId);

      if (updateOrderError) throw updateOrderError;

      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === orderId
            ? { ...order, return_status: newStatus, admin_notes: updatedNote }
            : order
        )
      );

      setSelectedStatuses((prev) => {
        const updated = { ...prev };
        delete updated[orderId];
        return updated;
      });
    } catch (err: any) {
      alert('Failed to update return status: ' + err.message);
    } finally {
      setSavingOrderId(null);
    }
  };

  return {
    orders,
    loading,
    expandedOrderId,
    selectedStatuses,
    logisticsNotes,
    savingOrderId,
    deliveryCharge,
    vatRate,
    isSaving,
    setDeliveryCharge,
    setVatRate,
    handleSaveSettings,
    handleCancel,
    toggleExpand,
    handleSelectStatus,
    handleNoteChange,
    handleStatusUpdate,
  };
}
