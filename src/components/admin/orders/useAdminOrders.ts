import { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';
import { Order } from '@/utils/messageUtils';
import { SupabaseOrderResponse } from './adminOrders.types';

export const useAdminOrders = (showToast: (msg: string, type?: 'success' | 'error') => void) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchAdminOrders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            product_id,
            quantity, 
            size, 
            color, 
            price_at_purchase,
            product_name,
            product_image,
            products:product_id (
              name,
              product_media (
                media_url
              )
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const formatted = (data as unknown as SupabaseOrderResponse[]).map((order) => {
          const items = (order.order_items || []).map((item) => ({
            product_id: item.product_id,
            product_name: item.product_name || item.products?.name || 'NOMAD APPAREL',
            product_image: item.product_image || item.products?.product_media?.[0]?.media_url || 'https://via.placeholder.com/80x100',
            size: item.size || 'N/A',
            color: item.color || 'N/A',
            quantity: item.quantity ? Number(item.quantity) : 1,
            price: item.price_at_purchase || 0
          }));

          return {
            id: order.id,
            created_at: order.created_at,
            total_amount: order.total_amount,
            status: order.status === 'Delivered / Completed' ? 'Delivered' : (order.status || 'Pending'),
            customer_name: order.customer_name,
            customer_phone: order.customer_phone,
            customer_email: order.customer_email,
            shipping_address: order.shipping_address,
            delivery_charge: order.delivery_charge,
            vat_amount: order.vat_amount,
            payment_status: order.payment_status || 'Unpaid / COD',
            courier_name: order.courier_name || '',
            tracking_id: order.tracking_id || '',
            admin_notes: order.admin_notes || '',
            customer_notes: order.customer_notes || '',
            return_reason: order.return_reason || '',
            items: items
          };
        });
        setOrders(formatted);
      }
    } catch (err) {
      console.error('Error fetching admin orders:', err);
      showToast('Failed to fetch orders.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminOrders();
  }, []);

  // Helper Function: audit_logs টেবিলে ইউজার আইডিসহ নিরাপদ লগ তৈরি করা
  const logOrderAction = async (actionType: string, entityId: string, changes: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('audit_logs').insert({
        entity_type: 'orders',
        action_type: actionType,
        user_id: user?.id || null, // profiles টেবিল থেকে নাম, পদবী ও ইমেইল পাওয়ার জন্য user_id সেভ
        changes: changes,
        metadata: { order_id: entityId },
        created_at: new Date().toISOString(),
      });
    } catch (auditErr) {
      console.error('Audit log failed for order action:', auditErr);
    }
  };

  const handleUpdateDetails = async (
    orderId: string, 
    updatedFields: { 
      payment_status: string; 
      courier_name: string; 
      tracking_id: string; 
      admin_notes: string; 
      customer_notes: string;
      return_reason?: string;
    }
  ) => {
    try {
      const currentOrder = orders.find(o => o.id === orderId);

      const { error } = await supabase
        .from('orders')
        .update({
          payment_status: updatedFields.payment_status,
          courier_name: updatedFields.courier_name,
          tracking_id: updatedFields.tracking_id,
          admin_notes: updatedFields.admin_notes,
          customer_notes: updatedFields.customer_notes,
          return_reason: updatedFields.return_reason || null
        })
        .eq('id', orderId);

      if (error) throw error;

      // audit_logs টেবিলে অডিট হিস্ট্রি ইনসার্ট
      await logOrderAction('UPDATE_ORDER_DETAILS', orderId, {
        payment_status: { old: currentOrder?.payment_status, new: updatedFields.payment_status },
        courier_name: { old: currentOrder?.courier_name, new: updatedFields.courier_name },
        tracking_id: { old: currentOrder?.tracking_id, new: updatedFields.tracking_id },
        admin_notes: { old: currentOrder?.admin_notes, new: updatedFields.admin_notes }
      });

      setOrders(prev => prev.map(o => 
        o.id === orderId 
          ? { 
              ...o, 
              ...updatedFields,
              return_reason: updatedFields.return_reason || '' 
            } 
          : o
      ));

      showToast('Order details updated successfully!', 'success');
    } catch (err) {
      console.error('Failed to update order details:', err);
      showToast('Failed to update details.', 'error');
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string, cancelReason?: string) => {
    try {
      const currentOrder = orders.find(o => o.id === orderId);
      const oldStatus = currentOrder?.status;

      const updateData: { status: string; return_reason?: string | null } = { status: newStatus };
      if (newStatus === 'Cancelled') {
        updateData.return_reason = cancelReason || null;
      } else {
        updateData.return_reason = null;
      }

      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId);

      if (error) throw error;

      if (newStatus === 'Cancelled' && oldStatus !== 'Cancelled' && oldStatus !== 'Shipped' && oldStatus !== 'Delivered') {
        if (currentOrder && currentOrder.items) {
          for (const item of currentOrder.items) {
            const prodId = (item as any).product_id;
            const qty = item.quantity;
            if (prodId) {
              const { data: prodData } = await supabase
                .from('products')
                .select('stock_quantity')
                .eq('id', prodId)
                .single();

              if (prodData) {
                const currentStock = prodData.stock_quantity ?? 0;
                const newStock = currentStock + qty;
                await supabase
                  .from('products')
                  .update({ stock_quantity: newStock })
                  .eq('id', prodId);
              }
            }
          }
        }
      }

      // audit_logs টেবিলে স্ট্যাটাস পরিবর্তনের হিস্ট্রি যুক্ত করা হলো
      await logOrderAction('UPDATE_ORDER_STATUS', orderId, {
        status: { old: oldStatus, new: newStatus },
        return_reason: { old: currentOrder?.return_reason, new: cancelReason || null }
      });

      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus, return_reason: cancelReason || '' } : o));
      showToast(`Order marked as ${newStatus}`, 'success');
    } catch (err) {
      console.error('Failed to update status:', err);
      showToast('Failed to update status.', 'error');
    }
  };

  const handleBulkPaymentStatusChange = async (selectedOrderIds: string[], newPaymentStatus: string) => {
    if (selectedOrderIds.length === 0) return;
    try {
      setLoading(true);
      const { error } = await supabase
        .from('orders')
        .update({ payment_status: newPaymentStatus })
        .in('id', selectedOrderIds);

      if (error) throw error;

      // বাল্ক আপডেটের জন্য audit_logs সেভ
      for (const id of selectedOrderIds) {
        const oldStatus = orders.find(o => o.id === id)?.payment_status;
        await logOrderAction('BULK_UPDATE_PAYMENT_STATUS', id, {
          payment_status: { old: oldStatus, new: newPaymentStatus }
        });
      }

      setOrders(prev => prev.map(o =>
        selectedOrderIds.includes(o.id) ? { ...o, payment_status: newPaymentStatus } : o
      ));

      showToast(`Updated payment status to "${newPaymentStatus}" for ${selectedOrderIds.length} orders.`, 'success');
    } catch (err) {
      console.error('Failed to bulk update payment status:', err);
      showToast('Failed to update payment status.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkStatusChange = async (selectedOrderIds: string[], newStatus: string) => {
    if (selectedOrderIds.length === 0) return;
    try {
      setLoading(true);
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .in('id', selectedOrderIds);

      if (error) throw error;

      // বাল্ক অর্ডার স্ট্যাটাস আপডেটের জন্য audit_logs সেভ
      for (const id of selectedOrderIds) {
        const oldStatus = orders.find(o => o.id === id)?.status;
        await logOrderAction('BULK_UPDATE_ORDER_STATUS', id, {
          status: { old: oldStatus, new: newStatus }
        });
      }

      setOrders(prev => prev.map(o =>
        selectedOrderIds.includes(o.id) ? { ...o, status: newStatus } : o
      ));

      showToast(`Updated order status to "${newStatus}" for ${selectedOrderIds.length} orders.`, 'success');
    } catch (err) {
      console.error('Failed to bulk update order status:', err);
      showToast('Failed to update status.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return {
    orders,
    loading,
    handleUpdateDetails,
    handleStatusChange,
    handleBulkPaymentStatusChange,
    handleBulkStatusChange
  };
};