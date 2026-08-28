import React, { useState, useEffect, useMemo, useRef } from 'react';
import ReactDOM from 'react-dom';
import { supabase } from '../../supabaseClient';
import './admin-animations.css';
import { CheckIcon, SendIcon } from '../icons';

import { Order, TEMPLATE_PRESETS, formatWhatsAppNumber, renderPersonalizedText } from '../../utils/messageUtils';
import { handlePrintInvoice, handlePrintBulkInvoices } from '../../utils/invoiceUtils';
import OrderCard from './OrderCard';

interface SupabaseProductMedia {
  media_url: string;
}

interface SupabaseProduct {
  name: string;
  product_media: SupabaseProductMedia[];
}

interface SupabaseOrderItem {
  quantity: number;
  size: string;
  color: string;
  price_at_purchase: number;
  product_name?: string;
  product_image?: string;
  products?: SupabaseProduct;
}

interface SupabaseOrderResponse {
  id: string;
  created_at: string;
  total_amount: number;
  status: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  shipping_address?: string;
  delivery_charge?: number;
  vat_amount?: number;
  payment_status?: string;
  courier_name?: string;
  tracking_id?: string;
  admin_notes?: string;
  customer_notes?: string;
  return_reason?: string;
  order_items: SupabaseOrderItem[];
}

interface AdminOrdersProps {
  isSearchOpen?: boolean;
  isFilterOpen?: boolean;
  onToggleSearch?: () => void;
  onToggleFilter?: () => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

const STATUS_OPTIONS = [
  'Pending',
  'Received',
  'Processing',
  'Shipped',
  'Delivered',
  'Cancelled'
];

const PAYMENT_STATUS_OPTIONS = [
  'ALL',
  'Paid',
  'Unpaid / COD',
  'Partial Paid'
];

const DATE_FILTERS = ['ALL TIME', 'TODAY', 'LAST 7 DAYS', 'THIS MONTH'];

const AdminOrders: React.FC<AdminOrdersProps> = ({
  isSearchOpen: propSearchOpen,
  isFilterOpen: propFilterOpen,
  onToggleSearch,
  onToggleFilter,
  searchQuery,
  onSearchChange
}) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [internalSearchTerm, setInternalSearchTerm] = useState<string>('');

  const searchTerm = searchQuery !== undefined ? searchQuery : internalSearchTerm;
  const setSearchTerm = (val: string) => {
    setInternalSearchTerm(val);
    if (onSearchChange) {
      onSearchChange(val);
    }
  };

  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [selectedPaymentStatusFilter, setSelectedPaymentStatusFilter] = useState<string>('ALL');
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>('ALL TIME');

  const [internalSearchOpen, setInternalSearchOpen] = useState<boolean>(false);
  const [internalFilterOpen, setInternalFilterOpen] = useState<boolean>(false);

  const searchOpen = propSearchOpen !== undefined ? propSearchOpen : internalSearchOpen;
  const filterOpen = propFilterOpen !== undefined ? propFilterOpen : internalFilterOpen;

  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const [activeModalOrder, setActiveModalOrder] = useState<Order | null>(null);
  const [modalSelectedStatus, setModalSelectedStatus] = useState<string>('');
  const [cancelReasonText, setCancelReasonText] = useState<string>('');
  const [isSubmittingCancel, setIsSubmittingCancel] = useState<boolean>(false);

  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [isBulkViewOpen, setIsBulkViewOpen] = useState<boolean>(false);
  const [bulkMessageType, setBulkMessageType] = useState<'whatsapp' | 'email'>('whatsapp');
  const [bulkMessageText, setBulkMessageText] = useState<string>(TEMPLATE_PRESETS.ALL);
  const [selectedPresetKey, setSelectedPresetKey] = useState<string>('ALL');
  const [bulkEmailSubject, setBulkEmailSubject] = useState<string>('Update Regarding Your NOMAD Order');
  const [sentIndexes, setSentIndexes] = useState<{ [key: string]: boolean }>({});
  const [expandedBulkItems, setExpandedBulkItems] = useState<{ [key: string]: boolean }>({});
  const [isMessageTemplateOpen, setIsMessageTemplateOpen] = useState<boolean>(false);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const modalContainerRef = useRef<HTMLDivElement | null>(null);
  const cancelTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const handleGlobalSearchToggle = () => {
      if (onToggleSearch) {
        onToggleSearch();
      } else {
        setInternalSearchOpen(prev => !prev);
      }
    };

    const handleGlobalFilterToggle = () => {
      if (onToggleFilter) {
        onToggleFilter();
      } else {
        setInternalFilterOpen(prev => !prev);
      }
    };

    window.addEventListener('admin-toggle-search', handleGlobalSearchToggle);
    window.addEventListener('admin-toggle-filter', handleGlobalFilterToggle);

    return () => {
      window.removeEventListener('admin-toggle-search', handleGlobalSearchToggle);
      window.removeEventListener('admin-toggle-filter', handleGlobalFilterToggle);
    };
  }, [onToggleSearch, onToggleFilter]);

  useEffect(() => {
    if (modalSelectedStatus === 'Cancelled' && cancelTextareaRef.current) {
      setTimeout(() => {
        cancelTextareaRef.current?.focus();
        cancelTextareaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 150);
    }
  }, [modalSelectedStatus]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  const handleToggleExpand = (orderId: string) => {
    setExpandedOrderId(prevId => (prevId === orderId ? null : orderId));
  };

  const toggleBulkItemExpand = (orderId: string) => {
    setExpandedBulkItems(prev => ({ ...prev, [orderId]: !prev[orderId] }));
  };

  const fetchAdminOrders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
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

  useEffect(() => {
    if (selectedStatusFilter !== 'ALL' && TEMPLATE_PRESETS[selectedStatusFilter]) {
      setBulkMessageText(TEMPLATE_PRESETS[selectedStatusFilter]);
      setSelectedPresetKey(selectedStatusFilter);
    } else {
      setBulkMessageText(TEMPLATE_PRESETS.ALL);
      setSelectedPresetKey('ALL');
    }
  }, [selectedStatusFilter]);

  const handleUpdateDetails = async (orderId: string, updatedFields: { payment_status: string; courier_name: string; tracking_id: string; admin_notes: string; customer_notes: string }) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          payment_status: updatedFields.payment_status,
          courier_name: updatedFields.courier_name,
          tracking_id: updatedFields.tracking_id,
          admin_notes: updatedFields.admin_notes,
          customer_notes: updatedFields.customer_notes
        })
        .eq('id', orderId);

      if (error) throw error;

      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, ...updatedFields } : o));
      showToast('Order details updated successfully!', 'success');
    } catch (err) {
      console.error('Failed to update order details:', err);
      showToast('Failed to update details.', 'error');
    }
  };

  const handleBulkPaymentStatusChange = async (newPaymentStatus: string) => {
    if (selectedOrderIds.length === 0) return;
    try {
      setLoading(true);
      const { error } = await supabase
        .from('orders')
        .update({ payment_status: newPaymentStatus })
        .in('id', selectedOrderIds);

      if (error) throw error;

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

  const handleBulkStatusChange = async (newStatus: string) => {
    if (selectedOrderIds.length === 0) return;
    try {
      setLoading(true);
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .in('id', selectedOrderIds);

      if (error) throw error;

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

  const handleStatusChange = async (orderId: string, newStatus: string, cancelReason?: string) => {
    try {
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

      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus, return_reason: cancelReason || '' } : o));
      showToast(`Order marked as ${newStatus}`, 'success');
    } catch (err) {
      console.error('Failed to update status:', err);
      showToast('Failed to update status.', 'error');
    }
  };

  const getStatusColor = (rawStatus: string) => {
    const s = rawStatus.trim().toLowerCase();
    if (s.includes('rec')) return '#7C4DFF';
    if (s.includes('proc')) return '#E040FB';
    if (s.includes('shipped')) return '#00B0FF';
    if (s.includes('delivered') || s.includes('completed')) return '#008000';
    if (s.includes('cancel')) return '#FF5252';
    return '#FFB800';
  };

  const handleOpenStatusModal = (order: Order) => {
    setActiveModalOrder(order);
    setModalSelectedStatus(order.status);
    setCancelReasonText(order.return_reason || '');
  };

  const handleConfirmCancelSubmit = async () => {
    if (!activeModalOrder || !cancelReasonText.trim() || isSubmittingCancel) return;
    setIsSubmittingCancel(true);
    try {
      await handleStatusChange(activeModalOrder.id, 'Cancelled', cancelReasonText.trim());
      setActiveModalOrder(null);
    } finally {
      setIsSubmittingCancel(false);
    }
  };

  const filteredOrders = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const cleanTermDigits = term.replace(/[^0-9]/g, '');

    return orders.filter(order => {
      let matchesSearch = !term;

      if (term) {
        const idMatch = order.id.toLowerCase().includes(term);
        const nameMatch = order.customer_name ? order.customer_name.toLowerCase().includes(term) : false;
        const emailMatch = order.customer_email ? order.customer_email.toLowerCase().includes(term) : false;
        const addressMatch = order.shipping_address ? order.shipping_address.toLowerCase().includes(term) : false;
        const courierMatch = order.courier_name ? order.courier_name.toLowerCase().includes(term) : false;
        const trackingMatch = order.tracking_id ? order.tracking_id.toLowerCase().includes(term) : false;
        const customerNotesMatch = order.customer_notes ? order.customer_notes.toLowerCase().includes(term) : false;
        const adminNotesMatch = order.admin_notes ? order.admin_notes.toLowerCase().includes(term) : false;
        const returnReasonMatch = order.return_reason ? order.return_reason.toLowerCase().includes(term) : false;
        const itemMatch = order.items.some(item => item.product_name && item.product_name.toLowerCase().includes(term));

        let phoneMatch = false;
        if (order.customer_phone) {
          const rawPhone = order.customer_phone.toLowerCase();
          const cleanPhoneDigits = rawPhone.replace(/[^0-9]/g, '');

          phoneMatch = rawPhone.includes(term);
          if (!phoneMatch && cleanTermDigits.length > 0) {
            const termNoLeadingZero = cleanTermDigits.replace(/^0+/, '');
            phoneMatch = cleanPhoneDigits.includes(cleanTermDigits) || 
                         (termNoLeadingZero.length >= 3 && cleanPhoneDigits.includes(termNoLeadingZero));
          }
        }

        matchesSearch = Boolean(
          idMatch ||
          nameMatch ||
          emailMatch ||
          addressMatch ||
          courierMatch ||
          trackingMatch ||
          customerNotesMatch ||
          adminNotesMatch ||
          returnReasonMatch ||
          itemMatch ||
          phoneMatch
        );
      }

      const matchesStatus = selectedStatusFilter === 'ALL' || order.status.toLowerCase().trim() === selectedStatusFilter.toLowerCase().trim();

      const orderPaymentStatus = order.payment_status || 'Unpaid / COD';
      const matchesPaymentStatus = selectedPaymentStatusFilter === 'ALL' || orderPaymentStatus.toLowerCase().trim() === selectedPaymentStatusFilter.toLowerCase().trim();

      const orderDate = new Date(order.created_at);
      const today = new Date();
      let matchesDate = true;

      if (selectedDateFilter === 'TODAY') {
        matchesDate = orderDate.toDateString() === today.toDateString();
      } else if (selectedDateFilter === 'LAST 7 DAYS') {
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 7);
        matchesDate = orderDate >= sevenDaysAgo;
      } else if (selectedDateFilter === 'THIS MONTH') {
        matchesDate = orderDate.getMonth() === today.getMonth() && orderDate.getFullYear() === today.getFullYear();
      }

      return matchesSearch && matchesStatus && matchesPaymentStatus && matchesDate;
    });
  }, [orders, searchTerm, selectedStatusFilter, selectedPaymentStatusFilter, selectedDateFilter]);

  const handleSelectToggle = (orderId: string) => {
    setSelectedOrderIds(prev =>
      prev.includes(orderId) ? prev.filter(id => id !== orderId) : [...prev, orderId]
    );
  };

  const isAllFilteredSelected = filteredOrders.length > 0 && filteredOrders.every(o => selectedOrderIds.includes(o.id));

  const handleSelectAllFiltered = () => {
    if (isAllFilteredSelected) {
      const filteredIds = filteredOrders.map(o => o.id);
      setSelectedOrderIds(prev => prev.filter(id => !filteredIds.includes(id)));
    } else {
      const filteredIds = filteredOrders.map(o => o.id);
      const newSet = new Set([...selectedOrderIds, ...filteredIds]);
      setSelectedOrderIds(Array.from(newSet));
    }
  };

  const selectedOrdersList = useMemo(() => {
    return orders.filter(o => selectedOrderIds.includes(o.id));
  }, [orders, selectedOrderIds]);

  const handleSendSingleWhatsApp = (order: Order) => {
    const waPhone = formatWhatsAppNumber(order.customer_phone || '');
    if (!waPhone) {
      showToast("Invalid phone number", 'error');
      return;
    }

    const personalizedMessage = renderPersonalizedText(bulkMessageText, order);
    const url = `https://wa.me/${waPhone}?text=${encodeURIComponent(personalizedMessage)}`;
    window.open(url, '_blank');

    setSentIndexes(prev => ({ ...prev, [order.id]: true }));
  };

  const isFilterVisible = filterOpen || selectedOrderIds.length > 0;

  if (isBulkViewOpen) {
    const activeBulkOrders = (selectedPresetKey === 'ALL' || !selectedPresetKey
      ? selectedOrdersList
      : selectedOrdersList.filter(o => o.status.toLowerCase().trim() === selectedPresetKey.toLowerCase().trim())
    ).filter(o => {
      if (!searchTerm.trim()) return true;
      const term = searchTerm.trim().toLowerCase();
      return (
        (o.customer_name && o.customer_name.toLowerCase().includes(term)) ||
        (o.customer_phone && o.customer_phone.toLowerCase().includes(term)) ||
        (o.id && o.id.toLowerCase().includes(term)) ||
        (o.customer_email && o.customer_email.toLowerCase().includes(term))
      );
    });

    const activeBulkEmails = activeBulkOrders
      .map(o => o.customer_email)
      .filter((email): email is string => Boolean(email && email.trim()));

    const bulkEmailBccList = Array.from(new Set(activeBulkEmails)).join(',');
    const bulkEmailHref = `mailto:?bcc=${encodeURIComponent(bulkEmailBccList)}&subject=${encodeURIComponent(bulkEmailSubject)}&body=${encodeURIComponent(bulkMessageText.replace(/{{name}}/g, 'Valued Customer').replace(/{{status}}/g, selectedPresetKey !== 'ALL' ? selectedPresetKey : 'Updated'))}`;

    return (
      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', maxWidth: '100%', position: 'relative', minHeight: '80vh', backgroundColor: '#050505', padding: '0px', boxSizing: 'border-box', borderRadius: '0px', border: 'none' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #222', paddingBottom: '16px' }}>
          <div style={{ flex: 1, marginRight: '10px' }}>
            {searchOpen ? (
              <input
                type="text"
                placeholder="SEARCH..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  maxWidth: '300px',
                  backgroundColor: '#000',
                  border: '1px solid #333',
                  padding: '8px 16px',
                  color: '#fff',
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  letterSpacing: '1px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  borderRadius: '25px',
                  transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
              />
            ) : (
              <h3 style={{ margin: 0, fontSize: '15px', color: '#fff', letterSpacing: '1px', fontWeight: 'bold' }}>
                {(selectedPresetKey || 'ALL').toUpperCase()} {activeBulkOrders.length}
              </h3>
            )}
          </div>
          <button
            type="button"
            onClick={() => setIsBulkViewOpen(false)}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: '#fff',
              padding: '6px 10px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              outline: 'none',
              transition: 'transform 0.2s ease, color 0.2s ease'
            }}
          >
            ✕
          </button>
        </div>

        <div className={`filter-expand-wrapper ${filterOpen ? 'open' : ''}`}>
          <div className="filter-expand-content animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', marginBottom: filterOpen ? '16px' : '0' }}>
            <div>
              <label style={{ display: 'block', fontSize: '9px', color: '#888', marginBottom: '6px', letterSpacing: '1px' }}>STATUS</label>
              <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', scrollbarWidth: 'none', whiteSpace: 'nowrap', paddingBottom: '4px', width: '100%' }}>
                {Object.keys(TEMPLATE_PRESETS).map((key) => {
                  const isPresetActive = selectedPresetKey === key;
                  return (
                    <button
                      type="button"
                      key={key}
                      onClick={() => {
                        setBulkMessageText(TEMPLATE_PRESETS[key]);
                        setSelectedPresetKey(key);
                      }}
                      style={{
                        backgroundColor: 'transparent',
                        color: isPresetActive ? '#ffffff' : '#666666',
                        border: 'none',
                        padding: '6px 10px',
                        fontSize: '9.5px',
                        fontWeight: isPresetActive ? 'bold' : 'normal',
                        cursor: 'pointer',
                        flexShrink: 0,
                        whiteSpace: 'nowrap',
                        transition: 'color 0.2s ease'
                      }}
                    >
                      {key.toUpperCase()}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <button
                type="button"
                onClick={() => setIsMessageTemplateOpen(prev => !prev)}
                style={{
                  backgroundColor: '#111',
                  border: '1px solid #333',
                  color: '#fff',
                  padding: '8px 12px',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  borderRadius: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  letterSpacing: '1px',
                  transition: 'background-color 0.2s ease'
                }}
              >
                <span>MESSAGE TEMPLATE</span>
                <span style={{ 
                  transform: isMessageTemplateOpen ? 'rotate(180deg)' : 'rotate(0deg)', 
                  transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                  fontSize: '9px' 
                }}>▼</span>
              </button>

              <div className={`filter-expand-wrapper ${isMessageTemplateOpen ? 'open' : ''}`}>
                <div className="filter-expand-content" style={{ paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {bulkMessageType === 'email' && (
                    <div>
                      <label style={{ display: 'block', fontSize: '10px', color: '#888', marginBottom: '4px' }}>EMAIL SUBJECT</label>
                      <input
                        type="text"
                        value={bulkEmailSubject}
                        onChange={(e) => setBulkEmailSubject(e.target.value)}
                        style={{ width: '100%', background: '#000', color: '#fff', border: '1px solid #333', padding: '10px 12px', fontSize: '11px', outline: 'none', boxSizing: 'border-box', borderRadius: '2px', transition: 'border-color 0.2s ease' }}
                      />
                    </div>
                  )}

                  <div>
                    <textarea
                      rows={5}
                      value={bulkMessageText}
                      onChange={(e) => {
                        setBulkMessageText(e.target.value);
                        setSelectedPresetKey('');
                      }}
                      style={{ width: '100%', background: '#000', color: '#fff', border: '1px solid #333', padding: '10px 12px', fontSize: '11px', outline: 'none', resize: 'vertical', boxSizing: 'border-box', borderRadius: '2px', transition: 'border-color 0.2s ease' }}
                    />
                    <div style={{ fontSize: '9px', color: '#888', marginTop: '4px' }}>
                      Variables: <code>{"{{name}}"}</code>, <code>{"{{status}}"}</code>, <code>{"{{order_id}}"}</code>, <code>{"{{courier}}"}</code>, <code>{"{{tracking}}"}</code>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
          {bulkMessageType === 'email' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <a
                href={bulkEmailHref}
                style={{
                  display: 'block',
                  textAlign: 'center',
                  width: '100%',
                  padding: '12px',
                  background: 'transparent',
                  color: '#fff',
                  fontWeight: 'bold',
                  border: '1px solid #fff',
                  fontSize: '11px',
                  cursor: 'pointer',
                  borderRadius: '2px',
                  textDecoration: 'none',
                  boxSizing: 'border-box',
                  transition: 'all 0.2s ease'
                }}
              >
                Send Email ({activeBulkEmails.length})
              </a>

              <div style={{ fontSize: '9.5px', color: '#888', textAlign: 'center' }}>
                Found {activeBulkEmails.length} valid emails out of {activeBulkOrders.length} selected orders.
              </div>
            </div>
          ) : (
            <div>
              <label style={{ display: 'block', fontSize: '10px', color: '#888', marginBottom: '8px' }}>RECIPIENT DISPATCH QUEUE</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {activeBulkOrders.map((ord) => {
                  const isSent = Boolean(sentIndexes[ord.id]);
                  const isItemExpanded = Boolean(expandedBulkItems[ord.id]);
                  const phone = ord.customer_phone || 'No phone';
                  const personalizedPreview = renderPersonalizedText(bulkMessageText, ord);
                  const statusColor = getStatusColor(ord.status);

                  return (
                    <div
                      key={ord.id}
                      onClick={() => toggleBulkItemExpand(ord.id)}
                      className="table-row-hover"
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                        background: '#000',
                        padding: '12px',
                        border: '1px solid #222',
                        borderRadius: '2px',
                        cursor: 'pointer',
                        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                            <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
                              {ord.customer_name || 'Customer'}
                            </span>
                            <span style={{ fontSize: '9px', fontWeight: 'bold', color: statusColor, border: `1px solid ${statusColor}`, padding: '1px 5px', borderRadius: '2px', whiteSpace: 'nowrap', flexShrink: 0 }}>
                              {ord.status.toUpperCase()}
                            </span>
                          </div>
                          <div style={{ fontSize: '10px', color: '#888', marginTop: '4px', fontFamily: 'monospace' }}>{phone}</div>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSendSingleWhatsApp(ord);
                          }}
                          style={{
                            backgroundColor: isSent ? '#222' : '#111',
                            color: isSent ? '#888' : '#ccc',
                            border: isSent ? '1px solid #444' : '1px solid #333',
                            padding: '6px 14px',
                            fontSize: '9.5px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            borderRadius: '2px',
                            flexShrink: 0,
                            transition: 'all 0.2s ease'
                          }}
                        >
                          {isSent ? 'SENT' : 'SEND'}
                        </button>
                      </div>
                      <div className={`filter-expand-wrapper ${isItemExpanded ? 'open' : ''}`}>
                        <div className="filter-expand-content">
                          <div style={{ fontSize: '10px', color: '#ccc', background: '#050505', padding: '10px', border: '1px solid #1a1a1a', borderRadius: '2px', whiteSpace: 'pre-wrap', marginTop: '6px' }}>
                            {personalizedPreview}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', maxWidth: '100%', position: 'relative' }}>

      {toast && (
        <div
          className="animate-pop"
          style={{
            position: 'fixed',
            bottom: '30px',
            right: '30px',
            backgroundColor: toast.type === 'success' ? '#fff' : '#333',
            color: toast.type === 'success' ? '#000' : '#fff',
            border: '1px solid #444',
            padding: '12px 20px',
            borderRadius: '2px',
            fontSize: '11px',
            fontWeight: 'bold',
            letterSpacing: '0.5px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          {toast.type === 'success' ? '✓' : '⚠'} {toast.message}
        </div>
      )}

      <div className={`filter-expand-wrapper ${searchOpen ? 'open' : ''}`}>
        <div className="filter-expand-content animate-fade-in">
          <input
            type="text"
            placeholder="SEARCH BY ID, NAME, PHONE, EMAIL, ITEM OR TRACKING..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              backgroundColor: '#000',
              border: '1px solid #333',
              padding: '11px 16px',
              color: '#fff',
              fontSize: '11px',
              fontFamily: 'monospace',
              letterSpacing: '1px',
              outline: 'none',
              boxSizing: 'border-box',
              borderRadius: '25px',
              transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          />
        </div>
      </div>

      <div className={`filter-expand-wrapper ${isFilterVisible ? 'open' : ''}`}>
        <div className="filter-expand-content animate-fade-in">
          <div
            style={{
              backgroundColor: '#050505',
              border: '1px solid #222',
              padding: '16px',
              borderRadius: '2px',
              width: '100%',
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px'
            }}
          >
            <div>
              <label style={{ display: 'block', fontSize: '9px', color: '#666', marginBottom: '6px', letterSpacing: '1px' }}>DATE RANGE</label>
              <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: '2px', width: '100%' }}>
                {DATE_FILTERS.map((dateFilter) => {
                  const isActive = selectedDateFilter === dateFilter;
                  return (
                    <button
                      type="button"
                      key={dateFilter}
                      onClick={() => setSelectedDateFilter(dateFilter)}
                      style={{
                        backgroundColor: 'transparent',
                        color: isActive ? '#ffffff' : '#666666',
                        border: 'none',
                        padding: '4px 0px',
                        fontSize: '10px',
                        fontFamily: 'monospace',
                        letterSpacing: '1px',
                        fontWeight: isActive ? 'bold' : 'normal',
                        cursor: 'pointer',
                        textTransform: 'uppercase',
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                        transition: 'color 0.2s ease'
                      }}
                    >
                      {dateFilter}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '9px', color: '#666', marginBottom: '6px', letterSpacing: '1px' }}>ORDER STATUS</label>
              <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: '2px', width: '100%' }}>
                {['ALL', ...STATUS_OPTIONS].map((status) => {
                  const isActive = selectedStatusFilter === status;
                  return (
                    <button
                      type="button"
                      key={status}
                      onClick={() => setSelectedStatusFilter(status)}
                      style={{
                        backgroundColor: 'transparent',
                        color: isActive ? '#ffffff' : '#666666',
                        border: 'none',
                        padding: '4px 0px',
                        fontSize: '10px',
                        fontFamily: 'monospace',
                        letterSpacing: '1px',
                        fontWeight: isActive ? 'bold' : 'normal',
                        cursor: 'pointer',
                        textTransform: 'uppercase',
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                        transition: 'color 0.2s ease'
                      }}
                    >
                      {status}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '9px', color: '#666', marginBottom: '6px', letterSpacing: '1px' }}>PAYMENT STATUS</label>
              <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: '2px', width: '100%' }}>
                {PAYMENT_STATUS_OPTIONS.map((pStatus) => {
                  const isActive = selectedPaymentStatusFilter === pStatus;
                  return (
                    <button
                      type="button"
                      key={pStatus}
                      onClick={() => setSelectedPaymentStatusFilter(pStatus)}
                      style={{
                        backgroundColor: 'transparent',
                        color: isActive ? '#ffffff' : '#666666',
                        border: 'none',
                        padding: '4px 0px',
                        fontSize: '10px',
                        fontFamily: 'monospace',
                        letterSpacing: '1px',
                        fontWeight: isActive ? 'bold' : 'normal',
                        cursor: 'pointer',
                        textTransform: 'uppercase',
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                        transition: 'color 0.2s ease'
                      }}
                    >
                      {pStatus}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              backgroundColor: selectedOrderIds.length > 0 ? '#111' : '#0a0a0a',
              border: '1px solid #222',
              padding: '12px 16px',
              borderRadius: '2px',
              marginTop: '14px',
              transition: 'background-color 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                onClick={handleSelectAllFiltered}
                style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '3px',
                  border: isAllFilteredSelected ? '1px solid #fff' : '1px solid #444',
                  backgroundColor: isAllFilteredSelected ? '#fff' : '#000',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  flexShrink: 0,
                  transition: 'all 0.2s ease'
                }}
              >
                {isAllFilteredSelected && (
                  <CheckIcon width="11" height="11" stroke="#000" strokeWidth="3.5" />
                )}
              </div>
              <span onClick={handleSelectAllFiltered} style={{ fontSize: '11px', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}>
                SELECT ALL FILTERED ({filteredOrders.length})
              </span>
            </div>

            <div className={`filter-expand-wrapper ${selectedOrderIds.length > 0 ? 'open' : ''}`}>
              <div className="filter-expand-content animate-fade-in">
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', paddingTop: '6px' }}>
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        handleBulkStatusChange(e.target.value);
                        e.target.value = '';
                      }
                    }}
                    style={{
                      backgroundColor: '#000',
                      color: '#fff',
                      border: '1px solid #444',
                      padding: '7px 10px',
                      fontSize: '10px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      borderRadius: '2px',
                      outline: 'none',
                      transition: 'border-color 0.2s ease'
                    }}
                  >
                    <option value="" style={{ background: '#000', color: '#fff' }}>MARK STATUS AS...</option>
                    {STATUS_OPTIONS.map(opt => (
                      <option key={opt} value={opt} style={{ background: '#000', color: '#fff' }}>{opt.toUpperCase()}</option>
                    ))}
                  </select>

                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        handleBulkPaymentStatusChange(e.target.value);
                        e.target.value = '';
                      }
                    }}
                    style={{
                      backgroundColor: '#000',
                      color: '#fff',
                      border: '1px solid #444',
                      padding: '7px 10px',
                      fontSize: '10px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      borderRadius: '2px',
                      outline: 'none',
                      transition: 'border-color 0.2s ease'
                    }}
                  >
                    <option value="" style={{ background: '#000', color: '#fff' }}>MARK PAYMENT AS...</option>
                    <option value="Paid" style={{ background: '#000', color: '#fff' }}>PAID</option>
                    <option value="Unpaid / COD" style={{ background: '#000', color: '#fff' }}>UNPAID / COD</option>
                    <option value="Partial Paid" style={{ background: '#000', color: '#fff' }}>PARTIAL PAID</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => handlePrintBulkInvoices(selectedOrdersList, showToast)}
                    style={{
                      backgroundColor: '#000',
                      color: '#fff',
                      border: '1px solid #444',
                      padding: '7px 12px',
                      fontSize: '10px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      borderRadius: '2px',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    BULK PRINT ({selectedOrderIds.length})
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setBulkMessageType('whatsapp');
                      setIsBulkViewOpen(true);
                    }}
                    style={{
                      backgroundColor: '#000',
                      color: '#fff',
                      border: '1px solid #444',
                      padding: '7px 12px',
                      fontSize: '10px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      borderRadius: '2px',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    WhatsApp ({selectedOrderIds.length})
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setBulkMessageType('email');
                      setIsBulkViewOpen(true);
                    }}
                    style={{
                      backgroundColor: '#000',
                      color: '#fff',
                      border: '1px solid #444',
                      padding: '7px 12px',
                      fontSize: '10px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      borderRadius: '2px',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    Email ({selectedOrderIds.length})
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#666', fontSize: '11px', letterSpacing: '1px' }}>
            LOADING ORDERS...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#666', fontSize: '11px', letterSpacing: '1px' }}>
            NO ORDERS FOUND
          </div>
        ) : (
          filteredOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              isSelected={selectedOrderIds.includes(order.id)}
              isExpanded={expandedOrderId === order.id}
              onToggleExpand={handleToggleExpand}
              onSelectToggle={handleSelectToggle}
              onOpenStatusModal={handleOpenStatusModal}
              onUpdateDetails={handleUpdateDetails}
              onPrintInvoice={(ord) => handlePrintInvoice(ord, showToast)}
              getStatusColor={getStatusColor}
            />
          ))
        )}
      </div>

      {activeModalOrder && ReactDOM.createPortal(
        <div
          className="animate-fade-in"
          onClick={() => setActiveModalOrder(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            transition: 'opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          <div
            ref={modalContainerRef}
            className="animate-pop"
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#23212c',
              borderRadius: '20px',
              width: '100%',
              maxWidth: '340px',
              padding: '20px',
              boxSizing: 'border-box',
              position: 'relative',
              boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
              color: '#fff',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
              {STATUS_OPTIONS.map((opt) => {
                const isSelected = modalSelectedStatus.toLowerCase() === opt.toLowerCase();
                return (
                  <div key={opt} style={{ display: 'flex', flexDirection: 'column' }}>
                    <div
                      onClick={async () => {
                        if (opt === 'Cancelled') {
                          setModalSelectedStatus('Cancelled');
                        } else {
                          setModalSelectedStatus(opt);
                          const currentOrderId = activeModalOrder.id;
                          setActiveModalOrder(null);
                          await handleStatusChange(currentOrderId, opt);
                        }
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 8px',
                        cursor: 'pointer',
                        borderRadius: '8px',
                        transition: 'background-color 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                      }}
                    >
                      <span style={{ fontSize: '13px', fontWeight: '600', letterSpacing: '0.5px', color: '#fff' }}>
                        {opt.toUpperCase()}
                      </span>
                      <div
                        style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '50%',
                          border: isSelected ? '2px solid #a855f7' : '2px solid #555',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'border-color 0.2s ease'
                        }}
                      >
                        {isSelected && (
                          <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#a855f7', transition: 'all 0.2s ease' }} />
                        )}
                      </div>
                    </div>

                    {opt === 'Cancelled' && modalSelectedStatus === 'Cancelled' && (
                      <div className="filter-expand-wrapper open">
                        <div className="filter-expand-content animate-fade-in" style={{ padding: '8px 0 4px 0' }}>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              backgroundColor: '#14131a',
                              border: '1px solid #3b3848',
                              borderRadius: '16px',
                              padding: '6px 6px 6px 14px',
                              gap: '8px'
                            }}
                          >
                            <textarea
                              ref={cancelTextareaRef}
                              rows={2}
                              autoFocus
                              placeholder="Type cancellation reason..."
                              value={cancelReasonText}
                              onChange={(e) => setCancelReasonText(e.target.value)}
                              style={{
                                flex: 1,
                                background: 'transparent',
                                border: 'none',
                                color: '#fff',
                                fontSize: '11px',
                                outline: 'none',
                                resize: 'none',
                                fontFamily: 'inherit',
                                wordBreak: 'break-word',
                                overflowWrap: 'break-word'
                              }}
                            />
                            <button
                              type="button"
                              disabled={!cancelReasonText.trim() || isSubmittingCancel}
                              onClick={handleConfirmCancelSubmit}
                              style={{
                                width: '30px',
                                height: '30px',
                                borderRadius: '50%',
                                backgroundColor: cancelReasonText.trim() ? '#FF5252' : '#2a2836',
                                border: 'none',
                                color: '#fff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: cancelReasonText.trim() ? 'pointer' : 'not-allowed',
                                transition: 'all 0.2s ease',
                                flexShrink: 0,
                                marginTop: '2px'
                              }}
                            >
                              <SendIcon width="14" height="14" stroke="currentColor" strokeWidth="2.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default AdminOrders;
