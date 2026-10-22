import React from 'react';
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
  } = useAdminLogistics();

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
        loading ? (
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
                const currentNote = logisticsNotes[item.id] !== undefined ? logisticsNotes[item.id] : (item.admin_notes || '');

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
                    noteValue={currentNote}
                    onNoteChange={handleNoteChange}
                    onToggleExpand={toggleExpand}
                    onSelectStatus={handleSelectStatus}
                    onStatusUpdate={handleStatusUpdate}
                  />
                );
              })
            )}
          </div>
        )
      )}
    </div>
  );
}
