import React from 'react';
import { formatDateForUI } from './adminOverview.utils';

interface OverviewFilterProps {
  showFilter: boolean;
  startDate: string;
  endDate: string;
  selectedPreset: string;
  dateFormat?: string;
  onPresetSelect: (preset: string) => void;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
}

export const OverviewFilter: React.FC<OverviewFilterProps> = ({
  showFilter,
  startDate,
  endDate,
  selectedPreset,
  dateFormat = 'DD/MM/YYYY',
  onPresetSelect,
  onStartDateChange,
  onEndDateChange,
}) => {
  return (
    <div className={`filter-expand-wrapper ${showFilter ? 'open' : ''}`}>
      <div className="filter-expand-content">
        <div className="date-filter-container">
          <div className="preset-buttons">
            {['ALL', 'TODAY', '7D', '30D'].map((p) => (
              <button
                key={p}
                className={`preset-btn ${selectedPreset === p ? 'active' : ''}`}
                onClick={() => onPresetSelect(p)}
              >
                {p === 'ALL' ? 'ALL TIME' : p === '7D' ? '7 DAYS' : p === '30D' ? '30 DAYS' : p}
              </button>
            ))}
          </div>

          <div className="custom-date-inputs">
            <div className="date-input-field">
              <span className={`date-display-label ${selectedPreset === 'CUSTOM' ? 'active-input' : ''}`}>
                {formatDateForUI(startDate, dateFormat)}
              </span>
              <input
                type="date"
                className="date-input-picker"
                value={startDate}
                onChange={(e) => onStartDateChange(e.target.value)}
              />
            </div>

            <span style={{ color: '#444', fontSize: '11px', fontWeight: 'bold' }}>TO</span>

            <div className="date-input-field">
              <span className={`date-display-label ${selectedPreset === 'CUSTOM' ? 'active-input' : ''}`}>
                {formatDateForUI(endDate, dateFormat)}
              </span>
              <input
                type="date"
                className="date-input-picker"
                value={endDate}
                onChange={(e) => onEndDateChange(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
