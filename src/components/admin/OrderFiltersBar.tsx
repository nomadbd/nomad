import React from 'react';
import { CheckIcon } from '../icons';
import { Order } from '../../utils/messageUtils';

interface OrderFiltersBarProps {
  dateFilters: string[];
  statusOptions: string[];
  paymentStatusOptions: string[];
  selectedDateFilter: string;
  setSelectedDateFilter: (val: string) => void;
  selectedStatusFilter: string;
  setSelectedStatusFilter: (val: string) => void;
  selectedPaymentStatusFilter: string;
  setSelectedPaymentStatusFilter: (val: string) => void;
  filteredOrdersLength: number;
  selectedOrderIds: string[];
  isAllFilteredSelected: boolean;
  onSelectAllFiltered: () => void;
  onBulkStatusChange: (status: string) => void;
  onBulkPaymentStatusChange: (status: string) => void;
  onPrintBulkInvoices: () => void;
  onOpenBulkMessage: (type: 'whatsapp' | 'email') => void;
}

const OrderFiltersBar: React.FC<OrderFiltersBarProps> = ({
  dateFilters,
  statusOptions,
  paymentStatusOptions,
  selectedDateFilter,
  setSelectedDateFilter,
  selectedStatusFilter,
  setSelectedStatusFilter,
  selectedPaymentStatusFilter,
  setSelectedPaymentStatusFilter,
  filteredOrdersLength,
  selectedOrderIds,
  isAllFilteredSelected,
  onSelectAllFiltered,
  onBulkStatusChange,
  onBulkPaymentStatusChange,
  onPrintBulkInvoices,
  onOpenBulkMessage
}) => {
  return (
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
          <label style={{ display: 'block', fontSize: '9px', color: '#666', marginBottom: '6px', letterSpacing: '1px' }}>
            DATE RANGE
          </label>
          <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: '2px', width: '100%' }}>
            {dateFilters.map((dateFilter) => {
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
          <label style={{ display: 'block', fontSize: '9px', color: '#666', marginBottom: '6px', letterSpacing: '1px' }}>
            ORDER STATUS
          </label>
          <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: '2px', width: '100%' }}>
            {['ALL', ...statusOptions].map((status) => {
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
          <label style={{ display: 'block', fontSize: '9px', color: '#666', marginBottom: '6px', letterSpacing: '1px' }}>
            PAYMENT STATUS
          </label>
          <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: '2px', width: '100%' }}>
            {paymentStatusOptions.map((pStatus) => {
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
            onClick={onSelectAllFiltered}
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
            {isAllFilteredSelected && <CheckIcon width="11" height="11" stroke="#000" strokeWidth="3.5" />}
          </div>
          <span onClick={onSelectAllFiltered} style={{ fontSize: '11px', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}>
            SELECT ALL FILTERED ({filteredOrdersLength})
          </span>
        </div>

        <div className={`filter-expand-wrapper ${selectedOrderIds.length > 0 ? 'open' : ''}`}>
          <div className="filter-expand-content animate-fade-in">
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', paddingTop: '6px' }}>
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    onBulkStatusChange(e.target.value);
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
                {statusOptions.map((opt) => (
                  <option key={opt} value={opt} style={{ background: '#000', color: '#fff' }}>
                    {opt.toUpperCase()}
                  </option>
                ))}
              </select>

              <select
                onChange={(e) => {
                  if (e.target.value) {
                    onBulkPaymentStatusChange(e.target.value);
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
                onClick={onPrintBulkInvoices}
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
                onClick={() => onOpenBulkMessage('whatsapp')}
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
                onClick={() => onOpenBulkMessage('email')}
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
  );
};

export default OrderFiltersBar;
