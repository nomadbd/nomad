import React from 'react';
import { CountryInfo } from './checkoutTypes';

interface CountryPickerModalProps {
  styles: any;
  countrySearch: string;
  onSearchChange: (val: string) => void;
  filteredCountries: CountryInfo[];
  onSelectCountry: (country: CountryInfo) => void;
  onClose: () => void;
}

const CountryPickerModal: React.FC<CountryPickerModalProps> = ({
  styles,
  countrySearch,
  onSearchChange,
  filteredCountries,
  onSelectCountry,
  onClose,
}) => {
  return (
    <div style={styles.pickerModal} onClick={onClose}>
      <div style={styles.pickerBox} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <span style={{ fontSize: '10px', letterSpacing: '1.8px', color: '#cccccc' }}>SELECT COUNTRY</span>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '14px' }}
          >✕</button>
        </div>

        <input
          className="nomad-checkout-field"
          style={styles.searchInput}
          placeholder="SEARCH COUNTRY OR CODE..."
          value={countrySearch}
          onChange={(e) => onSearchChange(e.target.value)}
          autoFocus
        />

        <div style={styles.countryList}>
          {filteredCountries.map((c, i) => (
            <div
              key={i}
              style={styles.countryItem}
              onClick={() => onSelectCountry(c)}
            >
              <span>{c.flag} {c.name}</span>
              <span style={{ color: '#cccccc', fontFamily: 'monospace' }}>{c.code}</span>
            </div>
          ))}
          {filteredCountries.length === 0 && (
            <div style={{ padding: '15px', color: '#b5b5b5', fontSize: '10px', textAlign: 'center' }}>
              NO COUNTRY FOUND
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CountryPickerModal;
