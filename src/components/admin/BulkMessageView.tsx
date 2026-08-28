import React, { useState, useEffect } from 'react';
import { Order, TEMPLATE_PRESETS, formatWhatsAppNumber, renderPersonalizedText } from '../../utils/messageUtils';

interface BulkMessageViewProps {
  selectedOrdersList: Order[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  searchOpen: boolean;
  filterOpen: boolean;
  selectedStatusFilter: string;
  bulkMessageType: 'whatsapp' | 'email';
  onClose: () => void;
  showToast: (message: string, type?: 'success' | 'error') => void;
  getStatusColor: (status: string) => string;
}

const BulkMessageView: React.FC<BulkMessageViewProps> = ({
  selectedOrdersList,
  searchTerm,
  setSearchTerm,
  searchOpen,
  filterOpen,
  selectedStatusFilter,
  bulkMessageType,
  onClose,
  showToast,
  getStatusColor
}) => {
  const [bulkMessageText, setBulkMessageText] = useState<string>(TEMPLATE_PRESETS.ALL);
  const [selectedPresetKey, setSelectedPresetKey] = useState<string>('ALL');
  const [bulkEmailSubject, setBulkEmailSubject] = useState<string>('Update Regarding Your NOMAD Order');
  const [sentIndexes, setSentIndexes] = useState<{ [key: string]: boolean }>({});
  const [expandedBulkItems, setExpandedBulkItems] = useState<{ [key: string]: boolean }>({});
  const [isMessageTemplateOpen, setIsMessageTemplateOpen] = useState<boolean>(false);

  useEffect(() => {
    if (selectedStatusFilter !== 'ALL' && TEMPLATE_PRESETS[selectedStatusFilter]) {
      setBulkMessageText(TEMPLATE_PRESETS[selectedStatusFilter]);
      setSelectedPresetKey(selectedStatusFilter);
    } else {
      setBulkMessageText(TEMPLATE_PRESETS.ALL);
      setSelectedPresetKey('ALL');
    }
  }, [selectedStatusFilter]);

  const toggleBulkItemExpand = (orderId: string) => {
    setExpandedBulkItems(prev => ({ ...prev, [orderId]: !prev[orderId] }));
  };

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
          onClick={onClose}
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
};

export default BulkMessageView;
