import React from 'react';

interface ProductFilterPanelProps {
  stockFilter: string;
  setStockFilter: (val: any) => void;
  dateSort: string;
  setDateSort: (val: any) => void;
  priceSort: string;
  setPriceSort: (val: any) => void;
  startDate: string;
  setStartDate: (val: string) => void;
  endDate: string;
  setEndDate: (val: string) => void;
  minPrice: string;
  setMinPrice: (val: string) => void;
  maxPrice: string;
  setMaxPrice: (val: string) => void;
}

export const ProductFilterPanel: React.FC<ProductFilterPanelProps> = ({
  stockFilter,
  setStockFilter,
  dateSort,
  setDateSort,
  priceSort,
  setPriceSort,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  minPrice,
  setMinPrice,
  maxPrice,
  setMaxPrice,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '20px', marginTop: '10px', backgroundColor: '#080808', padding: '16px', border: '1px solid #1a1a1a', borderRadius: '8px' }}>
      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
        <div>
          <div style={{ fontSize: '10px', color: '#777', fontFamily: 'monospace', letterSpacing: '1px', marginBottom: '8px' }}>STOCK STATUS</div>
          <div style={{ display: 'flex', gap: '14px', overflowX: 'auto', whiteSpace: 'nowrap', flexWrap: 'nowrap', scrollbarWidth: 'none' }}>
            {[
              { label: 'ALL', value: 'all' },
              { label: 'IN STOCK', value: 'in_stock' },
              { label: 'SOLD OUT', value: 'sold_out' },
              { label: 'HIDDEN', value: 'hidden' }
            ].map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setStockFilter(item.value)}
                className="smooth-transition"
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '0',
                  color: stockFilter === item.value ? '#fff' : '#666',
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  cursor: 'pointer',
                  fontWeight: stockFilter === item.value ? '700' : 'normal',
                  textDecoration: 'none',
                  flexShrink: 0
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '10px', color: '#777', fontFamily: 'monospace', letterSpacing: '1px', marginBottom: '8px' }}>SORT</div>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', overflowX: 'auto', whiteSpace: 'nowrap', flexWrap: 'nowrap', scrollbarWidth: 'none' }}>
            <div style={{ display: 'flex', gap: '14px', flexShrink: 0 }}>
              {[
                { label: 'NEWEST FIRST', value: 'newest' },
                { label: 'OLDEST FIRST', value: 'oldest' }
              ].map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setDateSort(item.value)}
                  className="smooth-transition"
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: '0',
                    color: dateSort === item.value ? '#fff' : '#666',
                    fontSize: '11px',
                    fontFamily: 'monospace',
                    cursor: 'pointer',
                    fontWeight: dateSort === item.value ? '700' : 'normal',
                    textDecoration: 'none',
                    flexShrink: 0
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0 }}>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="smooth-transition"
                style={{ backgroundColor: '#000', border: '1px solid #333', color: '#aaa', fontSize: '10px', fontFamily: 'monospace', padding: '4px 6px', borderRadius: '4px', outline: 'none' }}
              />
              <span style={{ color: '#555', fontSize: '10px' }}>-</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="smooth-transition"
                style={{ backgroundColor: '#000', border: '1px solid #333', color: '#aaa', fontSize: '10px', fontFamily: 'monospace', padding: '4px 6px', borderRadius: '4px', outline: 'none' }}
              />
            </div>
          </div>
        </div>

        <div>
          <div style={{ fontSize: '10px', color: '#777', fontFamily: 'monospace', letterSpacing: '1px', marginBottom: '8px' }}>PRICE</div>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', overflowX: 'auto', whiteSpace: 'nowrap', flexWrap: 'nowrap', scrollbarWidth: 'none' }}>
            <div style={{ display: 'flex', gap: '14px', flexShrink: 0 }}>
              {[
                { label: 'HIGH TO LOW', value: 'price_high' },
                { label: 'LOW TO HIGH', value: 'price_low' }
              ].map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setPriceSort(priceSort === item.value ? 'none' : item.value)}
                  className="smooth-transition"
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: '0',
                    color: priceSort === item.value ? '#fff' : '#666',
                    fontSize: '11px',
                    fontFamily: 'monospace',
                    cursor: 'pointer',
                    fontWeight: priceSort === item.value ? '700' : 'normal',
                    textDecoration: 'none',
                    flexShrink: 0
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0 }}>
              <input
                type="number"
                placeholder="MIN"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="smooth-transition"
                style={{ width: '60px', backgroundColor: '#000', border: '1px solid #333', color: '#fff', fontSize: '10px', fontFamily: 'monospace', padding: '4px 6px', borderRadius: '4px', outline: 'none' }}
              />
              <span style={{ color: '#555', fontSize: '10px' }}>-</span>
              <input
                type="number"
                placeholder="MAX"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="smooth-transition"
                style={{ width: '60px', backgroundColor: '#000', border: '1px solid #333', color: '#fff', fontSize: '10px', fontFamily: 'monospace', padding: '4px 6px', borderRadius: '4px', outline: 'none' }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
