import React, { useState, useEffect } from 'react';
import { CheckIcon, CloseIcon, EditIcon, ShareIcon, HistoryIcon } from '@/components/icons';
import { Order, TEMPLATE_PRESETS, formatWhatsAppNumber, renderPersonalizedText } from '@/utils/messageUtils';
import { supabase } from '@/supabaseClient';

const BD_COURIERS = [
  'Steadfast',
  'Pathao',
  'Paperfly',
  'RedX',
  'Sundarban Express',
  'SA Paribahan',
  'Korotoa',
  'Janani Express',
  'eCourier'
];

const CANCELLATION_REASONS = [
  'Customer not receive',
  'Customer refused',
  'Customer unreachable',
  'Wrong address',
  'Delayed delivery',
  'Damaged product'
];

export interface AuditLogItem {
  id: string;
  batch_id: string;
  action_type: string;
  field_name?: string;
  old_value?: string;
  new_value?: string;
  changes?: Record<string, { old: string; new: string }>;
  reason?: string;
  created_at: string;
  profiles?: {
    name: string;
    role: string;
    email: string;
  } | null;
}

export interface OrderCardProps {
  order: Order;
  isSelected: boolean;
  isExpanded: boolean;
  currentUserId?: string;
  onToggleExpand: (orderId: string) => void;
  onSelectToggle: (orderId: string) => void;
  onOpenStatusModal: (order: Order) => void;
  onUpdateDetails: (
    orderId: string, 
    updatedData: { payment_status: string; courier_name: string; tracking_id: string; admin_notes: string; customer_notes: string; return_reason?: string },
    auditPayload?: any
  ) => Promise<void>;
  onPrintInvoice: (order: Order) => void;
  getStatusColor: (status: string) => string;
}

const OrderCard: React.FC<OrderCardProps> = ({
  order,
  isSelected,
  isExpanded,
  currentUserId,
  onToggleExpand,
  onSelectToggle,
  onOpenStatusModal,
  onUpdateDetails,
  onPrintInvoice,
  getStatusColor
}) => {
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState<boolean>(false);

  const [editForm, setEditForm] = useState({
    payment_status: order.payment_status || 'Unpaid / COD',
    courier_name: order.courier_name || '',
    tracking_id: '',
    admin_notes: '',
    customer_notes: '',
    return_reason: order.return_reason || ''
  });

  const fetchAuditLogs = async () => {
    if (!order.id) return;
    setIsLoadingLogs(true);
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select(`
          id,
          batch_id,
          action_type,
          field_name,
          old_value,
          new_value,
          changes,
          reason,
          created_at,
          profiles:performed_by (
            name,
            role,
            email
          )
        `)
        .eq('order_id', order.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching audit logs:', error);
      } else if (data) {
        setAuditLogs(data as unknown as AuditLogItem[]);
      }
    } catch (err) {
      console.error('Audit log fetch error:', err);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  useEffect(() => {
    setEditForm({
      payment_status: order.payment_status || 'Unpaid / COD',
      courier_name: order.courier_name || '',
      tracking_id: '',
      admin_notes: '',
      customer_notes: '',
      return_reason: order.return_reason || ''
    });

    if (isExpanded) {
      fetchAuditLogs();
    }
  }, [order, isExpanded]);

  const statusColor = getStatusColor(order.status);
  const paymentStatusVal = order.payment_status || 'Unpaid / COD';
  const isPaid = paymentStatusVal.toLowerCase().includes('paid') && !paymentStatusVal.toLowerCase().includes('unpaid');
  const isPartial = paymentStatusVal.toLowerCase().includes('partial');

  const paymentColor = isPaid ? '#008000' : isPartial ? '#3b82f6' : '#FF5252';

  const totalItemsCount = order.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const displayItemCount = totalItemsCount > 0 ? totalItemsCount : '1+';

  const rawPhone = order.customer_phone || '';
  const cleanPhoneForDial = rawPhone.replace(/[^0-9+]/g, '');
  const waPhone = formatWhatsAppNumber(rawPhone);

  const activeTemplate = TEMPLATE_PRESETS[order.status] || TEMPLATE_PRESETS.ALL;
  const messageText = renderPersonalizedText(activeTemplate, order);
  const encodedMessage = encodeURIComponent(messageText);
  const emailSubject = encodeURIComponent(`Update Regarding Your NOMAD Order #${order.id.slice(0, 8)}`);

  const customerInfoText = `Name: ${order.customer_name || 'N/A'}\nPhone: ${order.customer_phone || 'N/A'}\nAddress: ${order.shipping_address || 'N/A'}`;

  const handlePaymentStatusSelect = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    e.stopPropagation();
    const newPaymentStatus = e.target.value;
    const oldPaymentStatus = order.payment_status || 'Unpaid / COD';

    if (newPaymentStatus === oldPaymentStatus) return;

    setIsUpdating(true);
    try {
      const batchId = crypto.randomUUID();
      const auditPayload = {
        batch_id: batchId,
        order_id: order.id,
        performed_by: currentUserId || null,
        action_type: 'UPDATE_PAYMENT_STATUS',
        changes: {
          'Payment Status': { old: oldPaymentStatus, new: newPaymentStatus }
        }
      };

      await supabase.from('audit_logs').insert([auditPayload]);

      await onUpdateDetails(order.id, {
        payment_status: newPaymentStatus,
        courier_name: order.courier_name || '',
        tracking_id: order.tracking_id || '',
        admin_notes: order.admin_notes || '',
        customer_notes: order.customer_notes || '',
        return_reason: order.return_reason || ''
      }, auditPayload);

      fetchAuditLogs();
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSaveDetails = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsUpdating(true);

    try {
      const newCourier = editForm.courier_name.trim() !== '' ? editForm.courier_name.trim() : (order.courier_name || '');
      const newTracking = editForm.tracking_id.trim() !== '' ? editForm.tracking_id.trim() : (order.tracking_id || '');
      const newAdminNotes = editForm.admin_notes.trim() !== '' ? editForm.admin_notes.trim() : (order.admin_notes || '');
      const newCustomerNotes = editForm.customer_notes.trim() !== '' ? editForm.customer_notes.trim() : (order.customer_notes || '');
      const newReturnReason = editForm.return_reason.trim() !== '' ? editForm.return_reason.trim() : (order.return_reason || '');

      const changesObj: Record<string, { old: string; new: string }> = {};

      if (newCourier !== (order.courier_name || '')) {
        changesObj['Courier Name'] = { old: order.courier_name || 'Not specified', new: newCourier };
      }
      if (newTracking !== (order.tracking_id || '')) {
        changesObj['Tracking ID'] = { old: order.tracking_id || 'Empty', new: newTracking };
      }
      if (newCustomerNotes !== (order.customer_notes || '')) {
        changesObj['Customer Notes'] = { old: order.customer_notes || 'Empty', new: newCustomerNotes };
      }
      if (newAdminNotes !== (order.admin_notes || '')) {
        changesObj['Admin Notes'] = { old: order.admin_notes || 'Empty', new: newAdminNotes };
      }
      if (newReturnReason !== (order.return_reason || '')) {
        changesObj['Cancellation Reason'] = { old: order.return_reason || 'None', new: newReturnReason };
      }

      let auditPayload = null;

      if (Object.keys(changesObj).length > 0) {
        const batchId = crypto.randomUUID();
        auditPayload = {
          batch_id: batchId,
          order_id: order.id,
          performed_by: currentUserId || null,
          action_type: 'UPDATE_DETAILS',
          changes: changesObj,
          reason: newReturnReason || undefined
        };

        await supabase.from('audit_logs').insert([auditPayload]);
      }

      const payload = {
        payment_status: editForm.payment_status,
        courier_name: newCourier,
        tracking_id: newTracking,
        admin_notes: newAdminNotes,
        customer_notes: newCustomerNotes,
        return_reason: newReturnReason
      };

      await onUpdateDetails(order.id, payload, auditPayload);
      setIsEditing(false);
      fetchAuditLogs();
    } finally {
      setIsUpdating(false);
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Customer Details - ${order.customer_name || 'NOMAD Order'}`,
          text: customerInfoText,
        });
      } catch (err) {
        console.error('Error sharing order:', err);
      }
    }
  };

  const actionLinkStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111',
    border: '1px solid #333',
    color: '#fff',
    padding: '4px 7px',
    borderRadius: '2px',
    fontSize: '9.5px',
    fontWeight: 'bold',
    cursor: 'pointer',
    userSelect: 'none',
    outline: 'none',
    textDecoration: 'none',
    whiteSpace: 'nowrap',
    flexShrink: 0,
    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
  };

  const smoothInputStyle = (editable: boolean): React.CSSProperties => ({
    width: '100%',
    boxSizing: 'border-box',
    background: editable ? '#121212' : '#080808',
    color: editable ? '#888' : '#ccc',
    border: editable ? '1px solid #555' : '1px solid #1c1c1c',
    padding: '10px 12px',
    fontSize: '11px',
    outline: 'none',
    borderRadius: '3px',
    transition: 'background 0.3s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.3s cubic-bezier(0.16, 1, 0.3, 1), color 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
    cursor: editable ? 'text' : 'default',
    userSelect: editable ? 'auto' : 'none',
    minHeight: '38px',
    height: '38px',
    display: 'flex',
    alignItems: 'center'
  });

  return (
    <div
      className="animate-fade-in table-row-hover"
      style={{
        backgroundColor: '#050505',
        border: isSelected ? '1px solid #fff' : '1px solid #222',
        padding: '16px',
        borderRadius: '2px',
        transition: 'border 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <div
              onClick={() => onSelectToggle(order.id)}
              style={{
                width: '18px',
                height: '18px',
                borderRadius: '3px',
                border: isSelected ? '1px solid #fff' : '1px solid #444',
                backgroundColor: isSelected ? '#fff' : '#000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                marginTop: '2px',
                flexShrink: 0,
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
            >
              {isSelected && (
                <CheckIcon width="11" height="11" stroke="#000" strokeWidth="3.5" />
              )}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span
                  onClick={() => onToggleExpand(order.id)}
                  title="Click to toggle details"
                  style={{
                    fontSize: '13px',
                    fontWeight: 'bold',
                    letterSpacing: '1px',
                    cursor: 'pointer',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  #{order.id.slice(0, 8)}... 
                  <span style={{ 
                    transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', 
                    transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                    display: 'inline-block',
                    fontSize: '10px'
                  }}>▼</span>
                </span>
              </div>
              <div style={{ fontSize: '10px', color: '#ccc', marginTop: '4px' }}>
                {new Date(order.created_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '15px', fontWeight: '800', color: '#fff' }}>
              ৳{order.total_amount}
            </div>
            <div style={{ fontSize: '9px', color: '#aaa' }}>
              {displayItemCount} ITEM(S)
            </div>
          </div>
        </div>

        <div className={`filter-expand-wrapper ${isExpanded ? 'open' : ''}`}>
          <div className="filter-expand-content">
            <div style={{ paddingTop: '8px', paddingBottom: '8px', borderTop: '1px solid #1a1a1a', borderBottom: '1px solid #1a1a1a', display: 'flex', flexDirection: 'column', gap: '20px' }}>

              <div>
                <h4 style={{ color: '#888', fontSize: '10px', letterSpacing: '1px', marginBottom: '10px', marginTop: '10px', fontWeight: 'bold' }}>ORDERED ITEMS</h4>
                {order.items.length > 0 ? order.items.map((item, idx) => (
                  <div key={`${item.product_name}-${idx}`} className="animate-fade-in" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    background: '#0a0a0a',
                    padding: '10px',
                    marginBottom: '8px',
                    borderRadius: '3px'
                  }}>
                    <img
                      src={item.product_image}
                      alt={item.product_name}
                      style={{ width: '45px', height: '55px', objectFit: 'cover', borderRadius: '2px', flexShrink: 0 }}
                    />
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '11px', color: '#fff', lineHeight: '1.3' }}>{item.product_name}</div>
                      <div style={{ fontSize: '9.5px', color: '#bbb', marginTop: '4px' }}>
                        SIZE: {item.size} • COLOR: {item.color} • QTY: {item.quantity}
                      </div>
                    </div>
                    <div style={{ fontWeight: 'bold', fontSize: '12px', color: '#fff', whiteSpace: 'nowrap', marginLeft: 'auto' }}>
                      ৳{item.price * item.quantity}
                    </div>
                  </div>
                )) : (
                  <div style={{ color: '#666', fontSize: '11px', fontStyle: 'italic', padding: '10px' }}>
                    No items found for this order.
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ color: '#888', fontSize: '10px', letterSpacing: '1.5px', margin: 0, fontWeight: 'bold' }}>MANAGEMENT DETAILS</h4>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsEditing(prev => {
                        if (prev) {
                          setEditForm({
                            payment_status: order.payment_status || 'Unpaid / COD',
                            courier_name: order.courier_name || '',
                            tracking_id: '',
                            admin_notes: '',
                            customer_notes: '',
                            return_reason: order.return_reason || ''
                          });
                        }
                        return !prev;
                      });
                    }}
                    title={isEditing ? "Cancel" : "Edit Details"}
                    style={{
                      backgroundColor: 'transparent',
                      border: 'none',
                      color: isEditing ? '#FF5252' : '#fff',
                      cursor: 'pointer',
                      fontSize: '10px',
                      fontWeight: 'bold',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '4px',
                      outline: 'none',
                      transition: 'color 0.2s ease, transform 0.2s ease'
                    }}
                  >
                    {isEditing ? (
                      <CloseIcon width="14" height="14" stroke="currentColor" strokeWidth="2.5" />
                    ) : (
                      <EditIcon width="14" height="14" stroke="currentColor" strokeWidth="2.5" />
                    )}
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '9px', color: '#777', marginBottom: '6px', letterSpacing: '0.5px' }}>COURIER NAME</label>
                    {!isEditing && (
                      <div style={{ fontSize: '11px', color: (editForm.courier_name || order.courier_name) ? '#ccc' : '#555', padding: '4px 0' }}>
                        {editForm.courier_name || order.courier_name || 'Not specified'}
                      </div>
                    )}
                    <div className={`filter-expand-wrapper ${isEditing ? 'open' : ''}`}>
                      <div className="filter-expand-content">
                        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: '6px', paddingTop: '4px' }}>
                          {BD_COURIERS.map((courier) => {
                            const selectedName = (editForm.courier_name || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
                            const courierKey = courier.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
                            const isChecked = selectedName !== '' && selectedName === courierKey;
                            return (
                              <button
                                type="button"
                                key={courier}
                                onClick={() => {
                                  if (!isEditing) return;
                                  setEditForm(prev => ({
                                    ...prev,
                                    courier_name: isChecked ? '' : courier
                                  }));
                                }}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  background: isChecked ? '#222' : '#0d0d0d',
                                  border: isChecked ? '1px solid #444' : '1px solid #1c1c1c',
                                  color: isChecked ? '#ffffff' : '#555555',
                                  padding: '6px 12px',
                                  borderRadius: '3px',
                                  fontSize: '9.5px',
                                  fontWeight: isChecked ? 'bold' : 'normal',
                                  whiteSpace: 'nowrap',
                                  cursor: isEditing ? 'pointer' : 'default',
                                  flexShrink: 0,
                                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                                  outline: 'none'
                                }}
                              >
                                {courier}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '9px', color: '#777', marginBottom: '6px', letterSpacing: '0.5px' }}>TRACKING ID</label>
                    <input
                      type="text"
                      readOnly={!isEditing}
                      placeholder={order.tracking_id || "Tracking / Memo No."}
                      value={isEditing ? editForm.tracking_id : (order.tracking_id || '')}
                      onChange={e => {
                        if (isEditing) setEditForm({ ...editForm, tracking_id: e.target.value });
                      }}
                      style={smoothInputStyle(isEditing)}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '9px', color: '#777', marginBottom: '6px', letterSpacing: '0.5px' }}>CUSTOMER NOTES</label>
                  <textarea
                    rows={2}
                    readOnly={!isEditing}
                    placeholder={order.customer_notes || "Add customer note..."}
                    value={isEditing ? editForm.customer_notes : (order.customer_notes || '')}
                    onChange={e => {
                      if (isEditing) setEditForm({ ...editForm, customer_notes: e.target.value });
                    }}
                    style={{ 
                      ...smoothInputStyle(isEditing), 
                      height: 'auto', 
                      minHeight: '38px', 
                      resize: isEditing ? 'vertical' : 'none', 
                      whiteSpace: 'pre-wrap', 
                      wordBreak: 'break-word', 
                      display: 'block' 
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '9px', color: '#777', marginBottom: '6px', letterSpacing: '0.5px' }}>ADMIN NOTES</label>
                  <textarea
                    rows={2}
                    readOnly={!isEditing}
                    placeholder={order.admin_notes || "Add private admin notes..."}
                    value={isEditing ? editForm.admin_notes : (order.admin_notes || '')}
                    onChange={e => {
                      if (isEditing) setEditForm({ ...editForm, admin_notes: e.target.value });
                    }}
                    style={{ 
                      ...smoothInputStyle(isEditing), 
                      height: 'auto', 
                      minHeight: '38px', 
                      resize: isEditing ? 'vertical' : 'none', 
                      whiteSpace: 'pre-wrap', 
                      wordBreak: 'break-word', 
                      display: 'block' 
                    }}
                  />
                </div>

                {(isEditing || editForm.return_reason || order.return_reason) && (
                  <div>
                    <label style={{ display: 'block', fontSize: '9px', color: '#ff4d4d', marginBottom: '6px', letterSpacing: '0.5px', fontWeight: 'bold' }}>CANCELLATION REASON</label>
                    {!isEditing && (editForm.return_reason || order.return_reason) && (
                      <div style={{ fontSize: '11px', color: '#ff4d4d', padding: '4px 0', fontWeight: 'bold' }}>
                        {editForm.return_reason || order.return_reason}
                      </div>
                    )}
                    <div className={`filter-expand-wrapper ${isEditing ? 'open' : ''}`}>
                      <div className="filter-expand-content">
                        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: '6px', paddingTop: '4px' }}>
                          {CANCELLATION_REASONS.map((reason) => {
                            const selectedReason = (editForm.return_reason || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
                            const reasonKey = reason.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
                            const isChecked = selectedReason !== '' && selectedReason === reasonKey;
                            return (
                              <button
                                type="button"
                                key={reason}
                                onClick={() => {
                                  if (!isEditing) return;
                                  setEditForm(prev => ({
                                    ...prev,
                                    return_reason: isChecked ? '' : reason
                                  }));
                                }}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  background: isChecked ? '#241010' : '#0d0d0d',
                                  border: isChecked ? '1px solid #552222' : '1px solid #1c1c1c',
                                  color: isChecked ? '#ff4d4d' : '#555555',
                                  padding: '6px 12px',
                                  borderRadius: '3px',
                                  fontSize: '9.5px',
                                  fontWeight: isChecked ? 'bold' : 'normal',
                                  whiteSpace: 'nowrap',
                                  cursor: isEditing ? 'pointer' : 'default',
                                  flexShrink: 0,
                                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                                  outline: 'none'
                                }}
                              >
                                {reason}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className={`filter-expand-wrapper ${isEditing ? 'open' : ''}`}>
                  <div className="filter-expand-content" style={{ paddingTop: '8px' }}>
                    <button
                      type="button"
                      onClick={handleSaveDetails}
                      disabled={isUpdating}
                      style={{
                        width: '100%',
                        padding: '12px',
                        background: '#fff',
                        color: '#000',
                        fontWeight: 'bold',
                        border: 'none',
                        fontSize: '10px',
                        letterSpacing: '1px',
                        cursor: isUpdating ? 'not-allowed' : 'pointer',
                        borderRadius: '3px',
                        opacity: isUpdating ? 0.6 : 1,
                        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                      }}
                    >
                      {isUpdating ? 'SAVING...' : 'SAVE DETAILS'}
                    </button>
                  </div>
                </div>
              </div>

              <div style={{ borderTop: '1px solid #1c1c1c', paddingTop: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <HistoryIcon width="13" height="13" stroke="#888" strokeWidth="2.2" />
                    <h4 style={{ color: '#888', fontSize: '10px', letterSpacing: '1.5px', margin: 0, fontWeight: 'bold' }}>
                      EDIT HISTORY & AUDIT LOGS
                    </h4>
                  </div>
                  {isLoadingLogs && <span style={{ fontSize: '9px', color: '#666' }}>Loading...</span>}
                </div>

                {auditLogs.length > 0 ? (
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'row', 
                    gap: '10px', 
                    overflowX: 'auto', 
                    scrollbarWidth: 'none', 
                    paddingBottom: '8px' 
                  }}>
                    {auditLogs.map((log) => (
                      <div
                        key={log.id}
                        className="animate-fade-in"
                        style={{
                          minWidth: '260px',
                          maxWidth: '300px',
                          flexShrink: 0,
                          background: '#080808',
                          border: '1px solid #1a1a1a',
                          borderLeft: '3px solid #444',
                          borderRadius: '3px',
                          padding: '10px 12px'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#fff' }}>
                              {log.profiles?.name || 'System / Admin'}
                            </span>
                            {log.profiles?.role && (
                              <span style={{ fontSize: '8px', background: '#1c1c1c', color: '#888', padding: '1px 5px', borderRadius: '2px', textTransform: 'uppercase' }}>
                                {log.profiles.role}
                              </span>
                            )}
                          </div>
                          <span style={{ fontSize: '9px', color: '#666' }}>
                            {new Date(log.created_at).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' })}
                          </span>
                        </div>

                        {log.changes && typeof log.changes === 'object' ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                            {Object.entries(log.changes).map(([field, val]) => (
                              <div key={field} style={{ fontSize: '10px', color: '#ccc', lineHeight: '1.4' }}>
                                <span style={{ color: '#777', fontWeight: 'bold' }}>{field}: </span>
                                <span style={{ color: '#ff5252', textDecoration: 'line-through' }}>{val.old || 'N/A'}</span>
                                <span style={{ color: '#888', margin: '0 4px' }}>➔</span>
                                <span style={{ color: '#4cd964', fontWeight: 'bold' }}>{val.new || 'N/A'}</span>
                              </div>
                            ))}
                          </div>
                        ) : log.field_name ? (
                          <div style={{ fontSize: '10px', color: '#ccc', marginTop: '4px' }}>
                            <span style={{ color: '#777', fontWeight: 'bold' }}>{log.field_name}: </span>
                            <span style={{ color: '#ff5252', textDecoration: 'line-through' }}>{log.old_value || 'N/A'}</span>
                            <span style={{ color: '#888', margin: '0 4px' }}>➔</span>
                            <span style={{ color: '#4cd964', fontWeight: 'bold' }}>{log.new_value || 'N/A'}</span>
                          </div>
                        ) : null}

                        {log.reason && (
                          <div style={{ fontSize: '9.5px', color: '#888', fontStyle: 'italic', marginTop: '4px' }}>
                            Reason: {log.reason}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: '10px', color: '#555', fontStyle: 'italic', padding: '6px 0' }}>
                    No edit history recorded for this order.
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#fff' }}>
              {order.customer_name || 'GUEST CUSTOMER'}
            </span>
            {order.customer_phone && (
              <span style={{ fontSize: '11px', color: '#bbb', fontFamily: 'monospace' }}>
                {order.customer_phone}
              </span>
            )}
            {order.customer_email && (
              <span style={{ fontSize: '10px', color: '#bbb' }}>
                • {order.customer_email}
              </span>
            )}
          </div>

          {order.shipping_address && (
            <div style={{ fontSize: '11px', color: '#ccc', lineHeight: '1.4' }}>
              {order.shipping_address}
            </div>
          )}

          <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flexWrap: 'nowrap', overflowX: 'auto', scrollbarWidth: 'none' }}>
            {cleanPhoneForDial && (
              <a
                href={`tel:${cleanPhoneForDial}`}
                onClick={(e) => e.stopPropagation()}
                title={`Call ${rawPhone}`}
                style={actionLinkStyle}
              >
                Call
              </a>
            )}

            {order.customer_email && (
              <a
                href={`mailto:${order.customer_email}?subject=${emailSubject}&body=${encodedMessage}`}
                onClick={(e) => e.stopPropagation()}
                title={`Email ${order.customer_email}`}
                style={actionLinkStyle}
              >
                Email
              </a>
            )}

            {waPhone && (
              <a
                href={`https://wa.me/${waPhone}?text=${encodedMessage}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                title="WhatsApp Customer"
                style={actionLinkStyle}
              >
                WhatsApp
              </a>
            )}

            <button
              type="button"
              onClick={handleShare}
              title="Share Customer Info"
              style={{ ...actionLinkStyle, padding: '4px 6px' }}
            >
              <ShareIcon width="12" height="12" stroke="currentColor" strokeWidth="2" />
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '4px', flexWrap: 'nowrap', width: '100%' }}>
          <button
            type="button"
            disabled={isUpdating}
            onClick={(e) => {
              e.stopPropagation();
              onOpenStatusModal(order);
            }}
            style={{
              backgroundColor: '#000',
              color: statusColor,
              border: `1px solid ${statusColor}`,
              padding: '6px 4px',
              fontSize: '8.5px',
              fontWeight: 'bold',
              borderRadius: '2px',
              flex: '1 1 0px',
              minWidth: '0',
              cursor: isUpdating ? 'not-allowed' : 'pointer',
              opacity: isUpdating ? 0.6 : 1,
              textAlign: 'center',
              textOverflow: 'ellipsis',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            <span>{order.status.toUpperCase()}</span>
            <span style={{ fontSize: '7px' }}>▼</span>
          </button>

          <select
            value={paymentStatusVal}
            disabled={isUpdating}
            onChange={handlePaymentStatusSelect}
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#000',
              color: paymentColor,
              border: `1px solid ${paymentColor}`,
              padding: '6px 4px',
              fontSize: '8.5px',
              fontWeight: 'bold',
              borderRadius: '2px',
              flex: '1 1 0px',
              minWidth: '0',
              cursor: isUpdating ? 'not-allowed' : 'pointer',
              opacity: isUpdating ? 0.6 : 1,
              textAlign: 'center',
              textOverflow: 'ellipsis',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            <option value="Unpaid / COD">UNPAID / COD</option>
            <option value="Paid">PAID</option>
            <option value="Partial Paid">PARTIAL PAID</option>
          </select>

          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onPrintInvoice(order); }}
            style={{ padding: '6px 12px', background: '#111', border: '1px solid #333', color: '#fff', fontSize: '9px', cursor: 'pointer', borderRadius: '2px', fontWeight: 'bold', flexShrink: 0, transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)' }}
          >
            PRINT
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderCard;
