import React, { useState } from 'react';
import { useAdminLogistics } from '@/hooks/useAdminLogistics';
import LogisticSettings from './LogisticSettings';
import LogisticsOrderCard from './LogisticsOrderCard';

interface AdminLogisticsProps {
  searchQuery?: string;
  isFilterOpen?: boolean;
  isSettingsOpen: boolean;
}

export default function AdminLogistics({ searchQuery, isFilterOpen, isSettingsOpen }: AdminLogisticsProps) {
  const {
    orders,
    loading,
    expandedOrderId,
    selectedStatuses,
    savingOrderId,
    deliveryCharge,
    vatRate,
    isSaving,
    selectedOrderIds,
    statusFilter,
    setStatusFilter,
    toggleSelectOrder,
    toggleSelectAll,
    setDeliveryCharge,
    setVatRate,
    handleSaveSettings,
    handleCancel,
    toggleExpand,
    handleSelectStatus,
    handleStatusUpdate,
  } = useAdminLogistics();

  // Template Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('received');

  const handleBulkWhatsApp = () => {
    if (selectedOrderIds.length === 0) {
      alert('দয়া করে অন্তত একটি অর্ডার সিলেক্ট করুন!');
      return;
    }
    setIsModalOpen(true);
  };

  const executeBulkMessage = () => {
    // নির্বাচিত অর্ডারগুলোর ফোন নম্বর ফিল্টার করা
    const selectedOrdersData = orders.filter((o) => selectedOrderIds.includes(o.id));
    const phones = selectedOrdersData.map((o) => o.customer_phone).filter(Boolean);

    if (phones.length === 0) {
      alert('সিলেক্ট করা অর্ডারগুলোতে কোনো ফোন নম্বর পাওয়া যায়নি!');
      return;
    }

    // ডেমো হিসেবে প্রথম নম্বরে হোয়াটসঅ্যাপ ওপেন করা বা কনফার্মেশন মেসেজ দেখানো
    alert(`মোট ${phones.length} জন কাস্টমারকে বাল্ক মেসেজ টেমপ্লেট (${selectedTemplate}) পাঠানো হচ্ছে!`);
    setIsModalOpen(false);
  };

  return (
    <div style={{ color: '#fff', width: '100%' }}>
      {isSettingsOpen ? (
        <LogisticSettings
          deliveryCharge={deliveryCharge}
          vatRate={vatRate}
          initialDeliveryCharge={deliveryCharge}
          initialVatRate={vatRate}
          isSaving={isSaving}
          onDeliveryChange={setDeliveryCharge}
          onVatChange={setVatRate}
          onSaveSettings={handleSaveSettings}
          onCancel={handleCancel}
        />
      ) : (
        <>
          {/* FILTER & BULK ACTION TOOLBAR */}
          <div style={{ padding: '10px 16px', backgroundColor: '#111', borderBottom: '1px solid #222', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <label style={{ fontSize: '11px', color: '#aaa', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={selectedOrderIds.length > 0 && selectedOrderIds.length === orders.length}
                  onChange={toggleSelectAll}
                  style={{ accentColor: '#2ecc71', cursor: 'pointer' }}
                />
                Select All ({selectedOrderIds.length})
              </label>

              {/* Status Filter Dropdown */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ backgroundColor: '#1a1a1a', color: '#fff', border: '1px solid #333', padding: '4px 8px', fontSize: '10px', borderRadius: '4px', cursor: 'pointer' }}
              >
                <option value="All">All Status</option>
                <option value="Pending">Pending</option>
                <option value="Received">Received</option>
              </select>
            </div>

            {/* Bulk Action Buttons */}
            {selectedOrderIds.length > 0 && (
              <button
                onClick={handleBulkWhatsApp}
                style={{ backgroundColor: '#2ecc71', color: '#060606', border: 'none', padding: '5px 10px', fontSize: '10px', fontWeight: 'bold', borderRadius: '4px', cursor: 'pointer' }}
              >
                Bulk Message ({selectedOrderIds.length})
              </button>
            )}
          </div>

          {loading ? (
            <div style={{ fontSize: '11px', color: '#888', padding: '20px 0', textAlign: 'center' }}>LOADING DATA...</div>
          ) : (
            <div style={{ border: '1px solid #1a1a1a', backgroundColor: '#060606' }}>
              {orders.length === 0 ? (
                <div style={{ padding: '30px', textAlign: 'center', color: '#555', fontSize: '11px' }}>
                  NO RETURN ORDERS FOUND
                </div>
              ) : (
                orders.map((item) => {
                  const isExpanded = expandedOrderId === item.id;
                  const currentStatus = item.return_status || 'Pending';
                  const pendingStatus = selectedStatuses[item.id];
                  const activeStatus = pendingStatus || currentStatus;
                  const hasChange = pendingStatus && pendingStatus !== currentStatus;
                  const isSavingThis = savingOrderId === item.id;
                  const isSelected = selectedOrderIds.includes(item.id);

                  return (
                    <LogisticsOrderCard
                      key={item.id}
                      item={item}
                      isExpanded={isExpanded}
                      currentStatus={currentStatus}
                      pendingStatus={pendingStatus}
                      activeStatus={activeStatus}
                      hasChange={hasChange}
                      isSavingThis={isSavingThis}
                      isSelected={isSelected}
                      onToggleSelect={toggleSelectOrder}
                      onToggleExpand={toggleExpand}
                      onSelectStatus={handleSelectStatus}
                      onStatusUpdate={handleStatusUpdate}
                    />
                  );
                })
              )}
            </div>
          )}
        </>
      )}

      {/* BULK MESSAGE TEMPLATE MODAL */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ backgroundColor: '#111', border: '1px solid #333', padding: '20px', borderRadius: '8px', width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#fff' }}>Select Message Template</div>
            
            <select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              style={{ backgroundColor: '#1a1a1a', color: '#fff', border: '1px solid #333', padding: '8px', fontSize: '12px', borderRadius: '4px' }}
            >
              <option value="received">রিটার্ন পার্সেল রিসিভ হয়েছে (Received Notice)</option>
              <option value="info">তথ্য ও যোগাযোগ সংক্রান্ত (Information Needed)</option>
            </select>

            <div style={{ fontSize: '11px', color: '#888', backgroundColor: '#0a0a0a', padding: '10px', borderRadius: '4px', border: '1px solid #222' }}>
              {selectedTemplate === 'received' 
                ? 'প্রিয় কাস্টমার, আপনার রিটার্ন পার্সেলটি আমাদের লজিস্টিক প্যানেলে রিসিভ করা হয়েছে।' 
                : 'প্রিয় কাস্টমার, আপনার রিটার্ন পার্সেলটির বিষয়ে কথা বলতে যোগাযোগ করুন।'}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ backgroundColor: '#222', color: '#ccc', border: 'none', padding: '6px 12px', fontSize: '11px', borderRadius: '4px', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={executeBulkMessage}
                style={{ backgroundColor: '#2ecc71', color: '#060606', border: 'none', padding: '6px 12px', fontSize: '11px', fontWeight: 'bold', borderRadius: '4px', cursor: 'pointer' }}
              >
                Send Bulk Message
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
