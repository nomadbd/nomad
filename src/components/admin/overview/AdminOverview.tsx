import React from 'react';
import '../admin-animations.css';
import { AdminOverviewProps } from './adminOverview.types';
import { useAdminOverview } from './useAdminOverview';
import { OverviewFilter } from './OverviewFilter';
import { FulfillmentStatusCard } from './FulfillmentStatusCard';
import { OverviewStatCards } from './OverviewStatCards';
import { OverviewChart } from './OverviewChart';

const AdminOverview: React.FC<AdminOverviewProps> = ({ 
  userRole = '', 
  showFilter = false,
  dateFormat = 'DD/MM/YYYY'
}) => {
  const normalizedRole = userRole.toUpperCase().trim();
  const canViewSensitiveData = ['SUPER_ADMIN', 'ADMIN'].includes(normalizedRole);

  const {
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    selectedPreset,
    setSelectedPreset,
    handlePresetSelect,
    selectedMetric,
    setSelectedMetric,
    granularity,
    totalRevenue,
    cancelledRevenue,
    totalOrders,
    pendingOrders,
    processingOrders,
    receivedOrders,
    shippedOrders,
    deliveredOrders,
    cancelledOrders,
    activeCatalogItems,
    outOfStockItems,
    lowStockItems,
    totalUsers,
    newUsers,
    chartData,
    calcPercent,
    validOrderCount,
    avgOrderValue,
  } = useAdminOverview(dateFormat);

  return (
    <div style={{ 
      color: '#FFFFFF', 
      fontFamily: 'monospace, sans-serif', 
      width: '100%', 
      maxWidth: '100%', 
      boxSizing: 'border-box',
      overflowX: 'hidden'
    }}>
      <style>{`
        * { box-sizing: border-box; }

        .date-filter-container {
          background-color: transparent;
          border: none;
          padding: 4px 0;
          display: flex;
          flex-direction: column;
          gap: 10px;
          width: 100%;
        }

        .preset-buttons {
          display: flex;
          gap: 10px;
          overflow-x: auto;
          scrollbar-width: none;
          max-width: 100%;
        }

        .preset-btn {
          background: transparent;
          border: none;
          color: #666666;
          font-size: 11px;
          font-weight: 600;
          padding: 4px 6px;
          cursor: pointer;
          white-space: nowrap;
          transition: color 0.2s ease;
        }

        .preset-btn:hover {
          color: #A0AEC0;
        }

        .preset-btn.active {
          background: transparent;
          color: #FFFFFF;
          font-weight: 700;
          border: none;
        }

        .custom-date-inputs {
          display: flex;
          align-items: center;
          gap: 8px;
          max-width: 100%;
          flex-wrap: wrap;
        }

        .date-input-field {
          position: relative;
          display: inline-flex;
          align-items: center;
        }

        .date-display-label {
          color: #666666;
          font-family: monospace;
          font-size: 11px;
          padding: 4px 6px;
          cursor: pointer;
          transition: color 0.2s ease;
          letter-spacing: 1px;
        }

        .date-display-label.active-input {
          color: #FFFFFF;
        }

        .date-input-picker {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          opacity: 0;
          cursor: pointer;
        }

        .two-column-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
          margin-top: 10px;
          width: 100%;
          max-width: 100%;
        }

        .metric-card {
          background-color: #080808;
          border: 1px solid #222222;
          padding: 14px 12px;
          border-radius: 2px;
          width: 100%;
          overflow: hidden;
          transition: border-color 0.3s ease;
        }

        .status-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
          width: 100%;
          max-width: 100%;
        }

        .filter-toggle-btn {
          background: transparent;
          border: none;
          color: #666666;
          font-size: 10px;
          padding: 4px 8px;
          cursor: pointer;
          transition: color 0.2s ease;
        }

        .filter-toggle-btn.active {
          background: transparent;
          color: #FFFFFF;
          border: none;
          font-weight: bold;
        }

        @media (min-width: 640px) {
          .status-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        }

        @media (min-width: 1024px) {
          .date-filter-container {
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
          }
          .custom-date-inputs { width: auto; }
        }
      `}</style>

      <OverviewFilter
        showFilter={showFilter}
        startDate={startDate}
        endDate={endDate}
        selectedPreset={selectedPreset}
        dateFormat={dateFormat}
        onPresetSelect={handlePresetSelect}
        onStartDateChange={(d) => {
          setStartDate(d);
          setSelectedPreset('CUSTOM');
        }}
        onEndDateChange={(d) => {
          setEndDate(d);
          setSelectedPreset('CUSTOM');
        }}
      />

      <FulfillmentStatusCard
        pendingOrders={pendingOrders}
        receivedOrders={receivedOrders}
        processingOrders={processingOrders}
        shippedOrders={shippedOrders}
        deliveredOrders={deliveredOrders}
        cancelledOrders={cancelledOrders}
        calcPercent={calcPercent}
      />

      <OverviewStatCards
        canViewSensitiveData={canViewSensitiveData}
        totalRevenue={totalRevenue}
        cancelledRevenue={cancelledRevenue}
        avgOrderValue={avgOrderValue}
        validOrderCount={validOrderCount}
        totalOrders={totalOrders}
        cancelledOrders={cancelledOrders}
        pendingOrders={pendingOrders}
        processingOrders={processingOrders}
        receivedOrders={receivedOrders}
        activeCatalogItems={activeCatalogItems}
        outOfStockItems={outOfStockItems}
        lowStockItems={lowStockItems}
        totalUsers={totalUsers}
        newUsers={newUsers}
      />

      {canViewSensitiveData && (
        <OverviewChart
          chartData={chartData}
          selectedMetric={selectedMetric}
          granularity={granularity}
          setSelectedMetric={setSelectedMetric}
        />
      )}
    </div>
  );
};

export default AdminOverview;
