import React from 'react';
import { formatNumber } from './adminOverview.utils';

interface OverviewStatCardsProps {
  canViewSensitiveData: boolean;
  totalRevenue: number;
  cancelledRevenue: number;
  avgOrderValue: number;
  validOrderCount: number;
  totalOrders: number;
  cancelledOrders: number;
  pendingOrders: number;
  processingOrders: number;
  receivedOrders: number;
  activeCatalogItems: number;
  outOfStockItems: number;
  lowStockItems: number;
  totalUsers: number;
  newUsers: number;
}

export const OverviewStatCards: React.FC<OverviewStatCardsProps> = ({
  canViewSensitiveData,
  totalRevenue,
  cancelledRevenue,
  avgOrderValue,
  validOrderCount,
  totalOrders,
  cancelledOrders,
  pendingOrders,
  processingOrders,
  receivedOrders,
  activeCatalogItems,
  outOfStockItems,
  lowStockItems,
  totalUsers,
  newUsers,
}) => {
  return (
    <>
      {canViewSensitiveData && (
        <div className="two-column-grid">
          <div className="metric-card animate-card">
            <span style={{ fontSize: '12px', color: '#A0AEC0' }}>TOTAL REVENUE</span>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#FFFFFF', marginTop: '4px' }}>
              ৳{formatNumber(totalRevenue)}
              <span style={{ fontSize: '11px', marginLeft: '8px', fontWeight: 'normal' }}>
                <span style={{ color: '#FF5252' }}>৳{formatNumber(cancelledRevenue)} Cancelled</span>
              </span>
            </div>
          </div>
          <div className="metric-card animate-card">
            <span style={{ fontSize: '12px', color: '#A0AEC0' }}>AVG ORDER VALUE</span>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#FFFFFF', marginTop: '4px' }}>
              ৳{formatNumber(avgOrderValue)}
              <span style={{ fontSize: '11px', marginLeft: '8px', fontWeight: 'normal' }}>
                <span style={{ color: '#008000' }}>{validOrderCount} Valid Orders</span>
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="two-column-grid">
        <div className="metric-card animate-card">
          <span style={{ fontSize: '12px', color: '#A0AEC0' }}>TOTAL ORDERS</span>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#FFFFFF', marginTop: '4px' }}>
            {formatNumber(totalOrders)}
            <span style={{ fontSize: '11px', marginLeft: '8px', fontWeight: 'normal' }}>
              <span style={{ color: '#008000' }}>{validOrderCount} Valid</span>
              <span style={{ color: '#666', margin: '0 4px' }}>/</span>
              <span style={{ color: '#FF5252' }}>{cancelledOrders} Cancelled</span>
            </span>
          </div>
        </div>
        <div className="metric-card animate-card">
          <span style={{ fontSize: '12px', color: '#A0AEC0' }}>ACTIVE QUEUE</span>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#FFFFFF', marginTop: '4px' }}>
            {formatNumber(pendingOrders + processingOrders)}
            <span style={{ fontSize: '11px', marginLeft: '8px', fontWeight: 'normal' }}>
              <span style={{ color: '#FFB800' }}>{pendingOrders} Pen</span>
              <span style={{ color: '#666', margin: '0 4px' }}>/</span>
              <span style={{ color: '#E040FB' }}>{processingOrders} Proc</span>
              <span style={{ color: '#666', margin: '0 4px' }}>/</span>
              <span style={{ color: '#7C4DFF' }}>{receivedOrders} Rec</span>
            </span>
          </div>
        </div>
      </div>

      <div className="two-column-grid">
        <div className="metric-card animate-card">
          <span style={{ fontSize: '12px', color: '#A0AEC0' }}>CATALOG ITEMS</span>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#FFFFFF', marginTop: '4px' }}>
            {formatNumber(activeCatalogItems)}
            <span style={{ fontSize: '11px', marginLeft: '8px', fontWeight: 'normal' }}>
              <span style={{ color: '#FF5252' }}>{outOfStockItems} Out of stock</span>
              <span style={{ color: '#666', margin: '0 4px' }}>/</span>
              <span style={{ color: '#FFB800' }}>{lowStockItems} Low stock</span>
            </span>
          </div>
        </div>
        <div className="metric-card animate-card">
          <span style={{ fontSize: '12px', color: '#A0AEC0' }}>TOTAL USERS</span>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#FFFFFF', marginTop: '4px' }}>
            {formatNumber(totalUsers)}
            <span style={{ fontSize: '11px', marginLeft: '8px', fontWeight: 'normal' }}>
              <span style={{ color: '#008000' }}>+{newUsers} New in period</span>
            </span>
          </div>
        </div>
      </div>
    </>
  );
};
