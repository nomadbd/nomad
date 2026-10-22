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
  const [savingOrderId, setSavingOrderId] = useState<string | null>(null);

  const [deliveryCharge, setDeliveryCharge] = useState<number | string>('');
  const [vatRate, setVatRate] = useState<number | string>('');
  const [initialDeliveryCharge, setInitialDeliveryCharge] = useState<number | string>('100');
  const [initialVatRate, setInitialVatRate] = useState<number | string>('0.05');
  const [settingId, setSettingId] = useState<number | null>(1);
  const [isEditing, setIsEditing] = useState<boolean>(false);
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
        setSettingId(data.id ?? 1);
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
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      const targetId = settingId ?? 1;
      const finalDc = deliveryCharge === '' ? initialDeliveryCharge : deliveryCharge;
      const finalVat = vatRate === '' ? initialVatRate : vatRate;

      const { data, error } = await supabase
        .from('store_settings')
        .upsert({
          id: targetId,
          delivery_charge: Number(finalDc),
          vat_rate: Number(finalVat),
          updated_at: new Date().toISOString(),
        })
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
      alert('Settings saved successfully!');
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

  const handleSelectStatus = (orderId: string, status: string) => {
    setSelectedStatuses((prev) => ({
      ...prev,
      [orderId]: status,
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
      if (currentReturnStatus === newStatus) {
        setSavingOrderId(null);
        return;
      }

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
        .update({ return_status: newStatus })
        .eq('id', orderId);

      if (updateOrderError) throw updateOrderError;

      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === orderId ? { ...order, return_status: newStatus } : order
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
    savingOrderId,
    deliveryCharge,
    vatRate,
    isEditing,
    isSaving,
    setDeliveryCharge,
    setVatRate,
    handleStartEdit,
    handleSaveSettings,
    handleCancel,
    toggleExpand,
    handleSelectStatus,
    handleStatusUpdate,
  };
}
