import React, { useState } from 'react';
import { useAdminLogistics } from '@/hooks/useAdminLogistics';
import LogisticsSettingsBar from './LogisticsSettingsBar';
import LogisticsSettingsModal from './LogisticSettings';
import LogisticsOrderCard from './LogisticsOrderCard';

export default function AdminLogistics() {
  const [activeTab, setActiveTab] = useState<'returns' | 'settings'>('returns');

  const {
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
  } = useAdminLogistics();

  return (
    <div style={{ color: '#fff', width: '100%' }}>
      <LogisticsSettingsBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        returnsCount={orders.length}
      />

      {activeTab === 'returns' ? (
        loading ? (
          <div style={{ fontSize: '11px', color: '#888', padding: '20px 0' }}>LOADING DATA...</div>
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
                    onToggleExpand={toggleExpand}
                    onSelectStatus={handleSelectStatus}
                    onStatusUpdate={handleStatusUpdate}
                  />
                );
              })
            )}
          </div>
        )
      ) : (
        <LogisticsSettingsModal
          deliveryCharge={deliveryCharge}
          vatRate={vatRate}
          initialDeliveryCharge={deliveryCharge}
          initialVatRate={vatRate}
          isEditing={isEditing}
          isSaving={isSaving}
          onDeliveryChange={setDeliveryCharge}
          onVatChange={setVatRate}
          onStartEdit={handleStartEdit}
          onSaveSettings={handleSaveSettings}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
}
