import React, { useState, useEffect, useMemo } from 'react';
import './admin-animations.css';

import { Order } from '../../utils/messageUtils';
import { handlePrintInvoice, handlePrintBulkInvoices } from '../../utils/invoiceUtils';
import OrderCard from './OrderCard';
import BulkMessageView from './BulkMessageView';
import OrderStatusModal from './OrderStatusModal';
import OrderFiltersBar from './OrderFiltersBar';

import { AdminOrdersProps } from './adminOrders.types';
import { useAdminOrders } from './useAdminOrders';

const STATUS_OPTIONS = ['Pending', 'Received', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
const PAYMENT_STATUS_OPTIONS = ['ALL', 'Paid', 'Unpaid / COD', 'Partial Paid'];
const DATE_FILTERS = ['ALL TIME', 'TODAY', 'LAST 7 DAYS', 'THIS MONTH'];

const AdminOrders: React.FC<AdminOrdersProps> = ({
  isSearchOpen: propSearchOpen,
  isFilterOpen: propFilterOpen,
  onToggleSearch,
  onToggleFilter,
  searchQuery,
  onSearchChange
}) => {
  const [internalSearchTerm, setInternalSearchTerm] = useState<string>('');
  const searchTerm = searchQuery !== undefined ? searchQuery : internalSearchTerm;
  const setSearchTerm = (val: string) => {
    setInternalSearchTerm(val);
    if (onSearchChange) onSearchChange(val);
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

  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [isBulkViewOpen, setIsBulkViewOpen] = useState<boolean>(false);
  const [bulkMessageType, setBulkMessageType] = useState<'whatsapp' | 'email'>('whatsapp');

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const {
    orders,
    loading,
    handleUpdateDetails,
    handleStatusChange,
    handleBulkPaymentStatusChange,
    handleBulkStatusChange
  } = useAdminOrders(showToast);

  useEffect(() => {
    const handleGlobalSearchToggle = () => {
      if (onToggleSearch) onToggleSearch();
      else setInternalSearchOpen(prev => !prev);
    };

    const handleGlobalFilterToggle = () => {
      if (onToggleFilter) onToggleFilter();
      else setInternalFilterOpen(prev => !prev);
    };

    window.addEventListener('admin-toggle-search', handleGlobalSearchToggle);
    window.addEventListener('admin-toggle-filter', handleGlobalFilterToggle);

    return () => {
      window.removeEventListener('admin-toggle-search', handleGlobalSearchToggle);
      window.removeEventListener('admin-toggle-filter', handleGlobalFilterToggle);
    };
  }, [onToggleSearch, onToggleFilter]);

  const handleToggleExpand = (orderId: string) => {
    setExpandedOrderId(prevId => (prevId === orderId ? null : orderId));
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
          idMatch || nameMatch || emailMatch || addressMatch || courierMatch || 
          trackingMatch || customerNotesMatch || adminNotesMatch || returnReasonMatch || itemMatch || phoneMatch
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

  const isFilterVisible = filterOpen || selectedOrderIds.length > 0;

  if (isBulkViewOpen) {
    return (
      <BulkMessageView
        selectedOrdersList={selectedOrdersList}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        searchOpen={searchOpen}
        filterOpen={filterOpen}
        selectedStatusFilter={selectedStatusFilter}
        bulkMessageType={bulkMessageType}
        onClose={() => setIsBulkViewOpen(false)}
        showToast={showToast}
        getStatusColor={getStatusColor}
      />
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
        <OrderFiltersBar
          dateFilters={DATE_FILTERS}
          statusOptions={STATUS_OPTIONS}
          paymentStatusOptions={PAYMENT_STATUS_OPTIONS}
          selectedDateFilter={selectedDateFilter}
          setSelectedDateFilter={setSelectedDateFilter}
          selectedStatusFilter={selectedStatusFilter}
          setSelectedStatusFilter={setSelectedStatusFilter}
          selectedPaymentStatusFilter={selectedPaymentStatusFilter}
          setSelectedPaymentStatusFilter={setSelectedPaymentStatusFilter}
          filteredOrdersLength={filteredOrders.length}
          selectedOrderIds={selectedOrderIds}
          isAllFilteredSelected={isAllFilteredSelected}
          onSelectAllFiltered={handleSelectAllFiltered}
          onBulkStatusChange={(status) => handleBulkStatusChange(selectedOrderIds, status)}
          onBulkPaymentStatusChange={(status) => handleBulkPaymentStatusChange(selectedOrderIds, status)}
          onPrintBulkInvoices={() => handlePrintBulkInvoices(selectedOrdersList, showToast)}
          onOpenBulkMessage={(type) => {
            setBulkMessageType(type);
            setIsBulkViewOpen(true);
          }}
        />
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
              onOpenStatusModal={(ord) => setActiveModalOrder(ord)}
              onUpdateDetails={handleUpdateDetails}
              onPrintInvoice={(ord) => handlePrintInvoice(ord, showToast)}
              getStatusColor={getStatusColor}
            />
          ))
        )}
      </div>

      {activeModalOrder && (
        <OrderStatusModal
          activeModalOrder={activeModalOrder}
          statusOptions={STATUS_OPTIONS}
          onClose={() => setActiveModalOrder(null)}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
};

export default AdminOrders;
