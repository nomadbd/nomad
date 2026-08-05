import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';

interface AdminOverviewProps {
  userRole?: string;
}

interface ChartPoint {
  dateKey: string;
  label: string;
  revenue: number;
  orders: number;
}

const formatNumber = (num: number): string => {
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return num.toLocaleString();
};

const AdminOverview: React.FC<AdminOverviewProps> = ({ userRole = '' }) => {
  const normalizedRole = userRole.toUpperCase().trim();
  const canViewSensitiveData = ['SUPER_ADMIN', 'ADMIN'].includes(normalizedRole);

  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedPreset, setSelectedPreset] = useState<string>('ALL');

  const [totalRevenue, setTotalRevenue] = useState<number>(0);
  const [totalOrders, setTotalOrders] = useState<number>(0);
  const [pendingOrders, setPendingOrders] = useState<number>(0);
  const [processingOrders, setProcessingOrders] = useState<number>(0);
  const [receivedOrders, setReceivedOrders] = useState<number>(0);
  const [shippedOrders, setShippedOrders] = useState<number>(0);
  const [deliveredOrders, setDeliveredOrders] = useState<number>(0);
  const [cancelledOrders, setCancelledOrders] = useState<number>(0);
  const [activeCatalogItems, setActiveCatalogItems] = useState<number>(0);

  const [totalUsers, setTotalUsers] = useState<number>(0);

  const [outOfStockCount, setOutOfStockCount] = useState<number>(0);
  const [lowStockCount, setLowStockCount] = useState<number>(0);

  const [chartData, setChartData] = useState<ChartPoint[]>([]);

  const formatDateToInput = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-').map(Number);
    if (!year || !month || !day) return '';
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
  };

  const getFilterSubtitle = (suffix: 'REVENUE' | 'ORDERS' | 'USERS' | 'TREND') => {
    if (selectedPreset === 'ALL') {
      return `ALL TIME ${suffix}`;
    }

    if (selectedPreset === 'TODAY' && startDate) {
      return `TODAY (${formatDisplayDate(startDate)})`;
    }

    if (startDate && endDate) {
      if (startDate === endDate) {
        return `${formatDisplayDate(startDate)} ${suffix}`;
      }
      return `${formatDisplayDate(startDate)} - ${formatDisplayDate(endDate)}`;
    }

    return `FILTERED ${suffix}`;
  };

  const handlePresetSelect = (preset: string) => {
    setSelectedPreset(preset);
    const now = new Date();

    if (preset === 'TODAY') {
      const todayStr = formatDateToInput(now);
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === '7D') {
      const past7 = new Date();
      past7.setDate(now.getDate() - 7);
      setStartDate(formatDateToInput(past7));
      setEndDate(formatDateToInput(now));
    } else if (preset === '30D') {
      const past30 = new Date();
      past30.setDate(now.getDate() - 30);
      setStartDate(formatDateToInput(past30));
      setEndDate(formatDateToInput(now));
    } else if (preset === 'THIS_MONTH') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      setStartDate(formatDateToInput(firstDay));
      setEndDate(formatDateToInput(now));
    } else if (preset === 'ALL') {
      setStartDate('');
      setEndDate('');
    }
  };

  const fetchMetricsData = async () => {
    try {
      let ordersQuery = supabase.from('orders').select('status, total_amount, created_at');

      if (startDate && startDate.trim() !== '') {
        ordersQuery = ordersQuery.gte('created_at', `${startDate}T00:00:00.000Z`);
      }
      if (endDate && endDate.trim() !== '') {
        ordersQuery = ordersQuery.lte('created_at', `${endDate}T23:59:59.999Z`);
      }

      const { data: orders, error: orderErr } = await ordersQuery;

      if (!orderErr && orders) {
        let revenue = 0;
        let pending = 0;
        let processing = 0;
        let received = 0;
        let shipped = 0;
        let delivered = 0;
        let cancelled = 0;

        const dateMap: { [key: string]: { revenue: number; orders: number } } = {};

        orders.forEach((o: any) => {
          const st = (o.status || '').toLowerCase().trim();

          if (st === 'pending') {
            pending++;
          } else if (st.includes('processing') || st.includes('proc')) {
            processing++;
          } else if (st.includes('received') || st.includes('rec')) {
            received++;
          } else if (st.includes('shipped')) {
            shipped++;
          } else if (st.includes('delivered') || st.includes('completed')) {
            delivered++;
          } else if (st.includes('cancel') || st.includes('cancelled')) {
            cancelled++;
          } else {
            pending++;
          }

          if (!st.includes('cancel')) {
            const orderAmount = Number(o.total_amount || 0);
            revenue += orderAmount;

            if (o.created_at) {
              const rawDate = new Date(o.created_at);
              const dateKey = formatDateToInput(rawDate);

              if (!dateMap[dateKey]) {
                dateMap[dateKey] = { revenue: 0, orders: 0 };
              }
              dateMap[dateKey].revenue += orderAmount;
              dateMap[dateKey].orders += 1;
            }
          }
        });

        const sortedDates = Object.keys(dateMap).sort();
        const formattedGraphPoints: ChartPoint[] = sortedDates.map((dateKey) => ({
          dateKey,
          label: formatDisplayDate(dateKey),
          revenue: dateMap[dateKey].revenue,
          orders: dateMap[dateKey].orders,
        }));

        setChartData(formattedGraphPoints);
        setTotalOrders(orders.length);
        setTotalRevenue(revenue);
        setPendingOrders(pending);
        setProcessingOrders(processing);
        setReceivedOrders(received);
        setShippedOrders(shipped);
        setDeliveredOrders(delivered);
        setCancelledOrders(cancelled);
      }

      const { count: productCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });

      if (productCount !== null) setActiveCatalogItems(productCount);

      const { count: outOfStock } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('stock', 0);

      if (outOfStock !== null) setOutOfStockCount(outOfStock);

      const { count: lowStock } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .gte('stock', 1)
        .lte('stock', 3);

      if (lowStock !== null) setLowStockCount(lowStock);

      let usersQuery = supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .not('role', 'in', '("admin","manager")');

      if (startDate && startDate.trim() !== '') {
        usersQuery = usersQuery.gte('created_at', `${startDate}T00:00:00.000Z`);
      }
      if (endDate && endDate.trim() !== '') {
        usersQuery = usersQuery.lte('created_at', `${endDate}T23:59:59.999Z`);
      }

      const { count: usersCount, error: userErr } = await usersQuery;

      if (!userErr && usersCount !== null) {
        setTotalUsers(usersCount);
      }

    } catch (err) {
      console.error('Error fetching analytics:', err);
    }
  };

  useEffect(() => {
    fetchMetricsData();

    const ordersSubscription = supabase
      .channel('admin-overview-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchMetricsData())
      .subscribe();

    return () => {
      supabase.removeChannel(ordersSubscription);
    };
  }, [startDate, endDate]);

  const calcPercent = (val: number) => {
    if (!totalOrders || totalOrders <= 0) return 0;
    const p = (val / totalOrders) * 100;
    return isNaN(p) ? 0 : Math.min(Math.max(p, 0), 100);
  };

  const validOrderCount = totalOrders - cancelledOrders;
  const avgOrderValue = validOrderCount > 0 ? Math.round(totalRevenue / validOrderCount) : 0;

  const statusItems = [
    { key: 'PENDING', label: 'PENDING', count: pendingOrders, color: '#facc15' },
    { key: 'PROC', label: 'PROC', count: processingOrders, color: '#c084fc' },
    { key: 'REC', label: 'REC', count: receivedOrders, color: '#60a5fa' },
    { key: 'SHIPPED', label: 'SHIPPED', count: shippedOrders, color: '#22d3ee' },
    { key: 'DELIVERED', label: 'DELIVERED', color: '#4ade80', count: deliveredOrders },
    { key: 'CANCELLED', label: 'CANCELLED', count: cancelledOrders, color: '#f87171' },
  ];

  const renderSVGChart = () => {
    if (chartData.length === 0) {
      return (
        <div style={{ padding: '30px 0', textAlign: 'center', color: '#666', fontSize: '12px' }}>
          NO TRANSACTION DATA AVAILABLE FOR SELECTED PERIOD
        </div>
      );
    }

    const svgWidth = 600;
    const svgHeight = 160;
    const paddingTop = 20;
    const paddingBottom = 30;
    const paddingLeft = 45;
    const paddingRight = 20;

    const chartInnerWidth = svgWidth - paddingLeft - paddingRight;
    const chartInnerHeight = svgHeight - paddingTop - paddingBottom;

    const displayValues = chartData.map((d) => d.revenue);
    const maxValue = Math.max(...displayValues, 1);

    const points = chartData.map((pt, index) => {
      const val = pt.revenue;
      const x =
        chartData.length === 1
          ? paddingLeft + chartInnerWidth / 2
          : paddingLeft + (index / (chartData.length - 1)) * chartInnerWidth;
      const y = svgHeight - paddingBottom - (val / maxValue) * chartInnerHeight;
      return { x, y, label: pt.label, value: val };
    });

    const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

    const areaD =
      points.length > 0
        ? `${pathD} L ${points[points.length - 1].x} ${svgHeight - paddingBottom} L ${points[0].x} ${
            svgHeight - paddingBottom
          } Z`
        : '';

    return (
      <div style={{ width: '100%', overflowX: 'auto' }}>
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}
        >
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {[0, 0.5, 1].map((ratio, idx) => {
            const yPos = svgHeight - paddingBottom - ratio * chartInnerHeight;
            const gridVal = Math.round(ratio * maxValue);
            return (
              <g key={idx}>
                <line
                  x1={paddingLeft}
                  y1={yPos}
                  x2={svgWidth - paddingRight}
                  y2={yPos}
                  stroke="#1b1b1b"
                  strokeDasharray="3 3"
                />
                <text
                  x={paddingLeft - 8}
                  y={yPos + 4}
                  fill="#555"
                  fontSize="9"
                  textAnchor="end"
                  fontFamily="monospace"
                >
                  ৳{formatNumber(gridVal)}
                </text>
              </g>
            );
          })}

          {areaD && <path d={areaD} fill="url(#chartGradient)" />}

          {pathD && (
            <path
              d={pathD}
              fill="none"
              stroke="#22d3ee"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {points.map((pt, i) => (
            <g key={i}>
              <circle
                cx={pt.x}
                cy={pt.y}
                r="3.5"
                fill="#080808"
                stroke="#22d3ee"
                strokeWidth="2"
              />
              {(chartData.length <= 8 || i === 0 || i === points.length - 1 || i % Math.ceil(chartData.length / 5) === 0) && (
                <text
                  x={pt.x}
                  y={svgHeight - 8}
                  fill="#718096"
                  fontSize="8"
                  textAnchor="middle"
                  fontFamily="monospace"
                >
                  {pt.label}
                </text>
              )}
            </g>
          ))}
        </svg>
      </div>
    );
  };

  return (
    <div style={{ 
      color: '#FFFFFF', 
      fontFamily: 'monospace, sans-serif', 
      width: '100%', 
      maxWidth: '100%', 
      minWidth: 0, 
      boxSizing: 'border-box',
      overflowX: 'hidden'
    }}>

      <style>{`
        * { box-sizing: border-box; }
        
        .date-filter-container {
          background-color: #080808;
          border: 1px solid #222222;
          padding: 12px;
          border-radius: 2px;
          margin-bottom: 12px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .preset-buttons {
          display: flex;
          gap: 6px;
          overflow-x: auto;
          scrollbar-width: none;
        }

        .preset-btn {
          background: #111;
          border: 1px solid #222;
          color: #666;
          font-size: 10px;
          font-weight: bold;
          padding: 6px 10px;
          cursor: pointer;
          border-radius: 2px;
          white-space: nowrap;
          transition: all 0.2s ease;
        }

        .preset-btn.active {
          background: #111;
          color: #FFFFFF;
          border-color: #333;
        }

        .custom-date-inputs {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .date-input {
          background: #111;
          border: 1px solid #222;
          color: #666666;
          font-family: monospace;
          font-size: 11px;
          padding: 6px 8px;
          border-radius: 2px;
          outline: none;
          width: 100%;
        }

        .date-input:valid,
        .date-input[value]:not([value=""]) {
          color: #FFFFFF;
        }

        .date-input::-webkit-calendar-picker-indicator {
          filter: opacity(0.4) grayscale(100%);
          cursor: pointer;
        }

        .two-column-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
          margin-top: 10px;
          width: 100%;
        }

        .metric-card {
          background-color: #080808;
          border: 1px solid #222222;
          padding: 14px 12px;
          border-radius: 2px;
          width: 100%;
        }

        .status-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
          width: 100%;
        }

        @media (min-width: 640px) {
          .status-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        @media (min-width: 1024px) {
          .date-filter-container {
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
          }

          .custom-date-inputs {
            width: auto;
          }

          .date-input {
            width: 135px;
          }
        }
      `}</style>

      <div className="date-filter-container">
        <div className="preset-buttons">
          <button 
            className={`preset-btn ${selectedPreset === 'ALL' ? 'active' : ''}`}
            onClick={() => handlePresetSelect('ALL')}
          >
            ALL TIME
          </button>
          <button 
            className={`preset-btn ${selectedPreset === 'TODAY' ? 'active' : ''}`}
            onClick={() => handlePresetSelect('TODAY')}
          >
            TODAY
          </button>
          <button 
            className={`preset-btn ${selectedPreset === '7D' ? 'active' : ''}`}
            onClick={() => handlePresetSelect('7D')}
          >
            7 DAYS
          </button>
          <button 
            className={`preset-btn ${selectedPreset === '30D' ? 'active' : ''}`}
            onClick={() => handlePresetSelect('30D')}
          >
            30 DAYS
          </button>
          <button 
            className={`preset-btn ${selectedPreset === 'THIS_MONTH' ? 'active' : ''}`}
            onClick={() => handlePresetSelect('THIS_MONTH')}
          >
            THIS MONTH
          </button>
        </div>

        <div className="custom-date-inputs">
          <input 
            type="date" 
            className="date-input"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setSelectedPreset('CUSTOM');
            }}
          />
          <span style={{ color: '#666666', fontSize: '11px', fontWeight: 'bold' }}>TO</span>
          <input 
            type="date" 
            className="date-input"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setSelectedPreset('CUSTOM');
            }}
          />
        </div>
      </div>

      <div style={{ 
        backgroundColor: '#080808', 
        border: '1px solid #222222', 
        padding: '14px', 
        borderRadius: '2px', 
        width: '100%'
      }}>
        <span style={{ fontSize: '15px', color: '#CBD5E0', letterSpacing: '1px', fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>
          FULFILLMENT STATUS
        </span>

        <div style={{ display: 'flex', height: '4px', backgroundColor: '#181818', borderRadius: '2px', overflow: 'hidden', marginBottom: '12px', width: '100%' }}>
          <div style={{ width: `${calcPercent(pendingOrders)}%`, backgroundColor: '#facc15' }} />
          <div style={{ width: `${calcPercent(processingOrders)}%`, backgroundColor: '#c084fc' }} />
          <div style={{ width: `${calcPercent(receivedOrders)}%`, backgroundColor: '#60a5fa' }} />
          <div style={{ width: `${calcPercent(shippedOrders)}%`, backgroundColor: '#22d3ee' }} />
          <div style={{ width: `${calcPercent(deliveredOrders)}%`, backgroundColor: '#4ade80' }} />
          <div style={{ width: `${calcPercent(cancelledOrders)}%`, backgroundColor: '#f87171' }} />
        </div>

        <div className="status-grid">
          {statusItems.map((item) => {
            const percent = calcPercent(item.count).toFixed(0);
            const isZero = item.count === 0;

            return (
              <div key={item.key} className="status-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <span style={{ color: isZero ? '#444' : item.color, fontSize: '10px', flexShrink: 0 }}>●</span>
                  <span style={{ fontSize: '15px', color: isZero ? '#666' : '#A0AEC0', fontWeight: 'bold', letterSpacing: '0.5px' }}>
                    {item.label}
                  </span>
                </div>

                <div style={{ fontSize: '20px', fontWeight: 'bold', color: isZero ? '#555' : '#FFFFFF', display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                  {formatNumber(item.count)}
                  <span style={{ fontSize: '10px', color: isZero ? '#444' : '#888', fontWeight: 'normal' }}>
                    ({percent}%)
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {canViewSensitiveData && (
        <div className="two-column-grid">
          <div className="metric-card">
            <span style={{ fontSize: '15px', color: '#A0AEC0', letterSpacing: '1px', display: 'block', marginBottom: '6px' }}>
              TOTAL REVENUE
            </span>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#FFFFFF' }}>
              ৳{formatNumber(totalRevenue)}
            </div>
            <span style={{ fontSize: '10px', color: '#718096', marginTop: '4px', display: 'block' }}>
              {getFilterSubtitle('REVENUE')}
            </span>
          </div>

          <div className="metric-card">
            <span style={{ fontSize: '15px', color: '#A0AEC0', letterSpacing: '1px', display: 'block', marginBottom: '6px' }}>
              AVG ORDER VALUE
            </span>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#FFFFFF' }}>
              ৳{formatNumber(avgOrderValue)}
            </div>
            <span style={{ fontSize: '10px', color: '#718096', marginTop: '4px', display: 'block' }}>
              PER ACTIVE ORDER
            </span>
          </div>
        </div>
      )}

      <div className="two-column-grid">
        <div className="metric-card">
          <span style={{ fontSize: '15px', color: '#A0AEC0', letterSpacing: '1px', display: 'block', marginBottom: '6px' }}>
            TOTAL ORDERS
          </span>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#FFFFFF' }}>
            {formatNumber(totalOrders)}
          </div>
          <span style={{ fontSize: '10px', color: '#718096', marginTop: '4px', display: 'block' }}>
            {getFilterSubtitle('ORDERS')}
          </span>
        </div>

        <div className="metric-card">
          <span style={{ fontSize: '15px', color: '#A0AEC0', letterSpacing: '1px', display: 'block', marginBottom: '6px' }}>
            ACTIVE QUEUE
          </span>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#FFFFFF', display: 'flex', alignItems: 'baseline', gap: '4px' }}>
            <span>{formatNumber(pendingOrders + processingOrders)}</span>
            <span style={{ fontSize: '14px', color: '#718096' }}>/</span>
            <span style={{ fontSize: '15px', color: '#CBD5E0', fontWeight: 'normal' }}>{formatNumber(receivedOrders)} REC</span>
          </div>
          <span style={{ fontSize: '10px', color: '#718096', marginTop: '4px', display: 'block' }}>
            PENDING & PROC
          </span>
        </div>
      </div>

      <div className="two-column-grid">
        <div className="metric-card">
          <span style={{ fontSize: '15px', color: '#A0AEC0', letterSpacing: '1px', display: 'block', marginBottom: '6px' }}>
            CATALOG ITEMS
          </span>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#FFFFFF' }}>
            {formatNumber(activeCatalogItems)}
          </div>
          <span style={{ fontSize: '10px', color: '#718096', marginTop: '4px', display: 'block' }}>
            LIVE ITEMS
          </span>
        </div>

        <div className="metric-card">
          <span style={{ fontSize: '15px', color: '#A0AEC0', letterSpacing: '1px', display: 'block', marginBottom: '6px' }}>
            TOTAL USERS
          </span>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#FFFFFF' }}>
            {formatNumber(totalUsers)}
          </div>
          <span style={{ fontSize: '10px', color: '#718096', marginTop: '4px', display: 'block' }}>
            {getFilterSubtitle('USERS')}
          </span>
        </div>
      </div>

      <div className="two-column-grid">
        <div className="metric-card" style={{ gridColumn: 'span 2' }}>
          <span style={{ fontSize: '15px', color: '#A0AEC0', letterSpacing: '1px', display: 'block', marginBottom: '6px' }}>
            STOCK ALERTS
          </span>

          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#FFFFFF' }}>
            {outOfStockCount > 0 || lowStockCount > 0 ? (
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                <span style={{ color: outOfStockCount > 0 ? '#f87171' : '#FFFFFF', fontSize: '20px' }}>
                  {formatNumber(outOfStockCount)} OUT
                </span>
                <span style={{ fontSize: '14px', color: '#718096' }}>/</span>
                <span style={{ color: lowStockCount > 0 ? '#facc15' : '#FFFFFF', fontSize: '15px', fontWeight: 'normal' }}>
                  {formatNumber(lowStockCount)} LOW
                </span>
              </div>
            ) : (
              'ALL IN STOCK'
            )}
          </div>

          <span style={{ fontSize: '10px', color: '#718096', marginTop: '4px', display: 'block' }}>
            {outOfStockCount > 0 || lowStockCount > 0 
              ? `${outOfStockCount} OUT OF STOCK, ${lowStockCount} LOW (≤ 3)` 
              : 'ALL STOCKS HEALTHY'}
          </span>
        </div>
      </div>

      {canViewSensitiveData && (
        <div style={{
          backgroundColor: '#080808',
          border: '1px solid #222222',
          padding: '14px',
          borderRadius: '2px',
          marginTop: '10px',
          width: '100%'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '15px', color: '#CBD5E0', letterSpacing: '1px', fontWeight: 'bold' }}>
              REVENUE TREND
            </span>
            <span style={{ fontSize: '10px', color: '#718096' }}>
              {getFilterSubtitle('TREND')}
            </span>
          </div>

          {renderSVGChart()}
        </div>
      )}

    </div>
  );
};

export default AdminOverview;
