import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../../supabaseClient';

interface AdminOverviewProps {
  userRole?: string;
}

interface ChartPoint {
  dateKey: string;
  label: string;
  revenue: number;
  orders: number;
  aov: number;
}

type MetricType = 'REVENUE' | 'ORDERS' | 'AOV';
type GranularityType = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

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
  const [selectedPreset, setSelectedPreset] = useState<string>('30D');
  
  // Custom Filter & Graph States
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('REVENUE');
  const [granularity, setGranularity] = useState<GranularityType>('DAILY');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

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

  const [rawOrdersData, setRawOrdersData] = useState<any[]>([]);

  const formatDateToInput = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 1) return parts[0]; // Year
    if (parts.length === 2) {
      const date = new Date(Number(parts[0]), Number(parts[1]) - 1, 1);
      return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }).toUpperCase();
    }
    const [year, month, day] = parts.map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
  };

  // Preset Handlers (Only ALL, TODAY, 7D, 30D)
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
    } else if (preset === 'ALL') {
      setStartDate('');
      setEndDate('');
    }
  };

  // Auto-detect Granularity based on Date Range selected
  useEffect(() => {
    if (!startDate || !endDate) {
      setGranularity('MONTHLY');
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24));

    if (diffDays <= 35) setGranularity('DAILY');
    else if (diffDays <= 180) setGranularity('WEEKLY');
    else if (diffDays <= 1095) setGranularity('MONTHLY'); // up to 3 years
    else setGranularity('YEARLY'); // 3+ to 5+ years
  }, [startDate, endDate]);

  useEffect(() => {
    handlePresetSelect('30D');
  }, []);

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
        setRawOrdersData(orders);

        let revenue = 0;
        let pending = 0;
        let processing = 0;
        let received = 0;
        let shipped = 0;
        let delivered = 0;
        let cancelled = 0;

        orders.forEach((o: any) => {
          const st = (o.status || '').toLowerCase().trim();

          if (st === 'pending') pending++;
          else if (st.includes('proc')) processing++;
          else if (st.includes('rec')) received++;
          else if (st.includes('shipped')) shipped++;
          else if (st.includes('delivered') || st.includes('completed')) delivered++;
          else if (st.includes('cancel')) cancelled++;
          else pending++;

          if (!st.includes('cancel')) {
            revenue += Number(o.total_amount || 0);
          }
        });

        setTotalOrders(orders.length);
        setTotalRevenue(revenue);
        setPendingOrders(pending);
        setProcessingOrders(processing);
        setReceivedOrders(received);
        setShippedOrders(shipped);
        setDeliveredOrders(delivered);
        setCancelledOrders(cancelled);
      }

      // Catalog & Stock Counts
      const { count: productCount } = await supabase.from('products').select('*', { count: 'exact', head: true });
      if (productCount !== null) setActiveCatalogItems(productCount);

      const { count: outOfStock } = await supabase.from('products').select('*', { count: 'exact', head: true }).eq('stock', 0);
      if (outOfStock !== null) setOutOfStockCount(outOfStock);

      const { count: lowStock } = await supabase.from('products').select('*', { count: 'exact', head: true }).gte('stock', 1).lte('stock', 3);
      if (lowStock !== null) setLowStockCount(lowStock);

      // Users Count
      let usersQuery = supabase.from('profiles').select('*', { count: 'exact', head: true }).not('role', 'in', '("admin","manager")');
      if (startDate) usersQuery = usersQuery.gte('created_at', `${startDate}T00:00:00.000Z`);
      if (endDate) usersQuery = usersQuery.lte('created_at', `${endDate}T23:59:59.999Z`);

      const { count: usersCount } = await usersQuery;
      if (usersCount !== null) setTotalUsers(usersCount);

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

  // Dynamic Chart Points Generation
  const chartData = useMemo(() => {
    if (!rawOrdersData || rawOrdersData.length === 0) return [];

    const dateMap: { [key: string]: { revenue: number; orders: number } } = {};

    rawOrdersData.forEach((o) => {
      const st = (o.status || '').toLowerCase();
      if (st.includes('cancel') || !o.created_at) return;

      const d = new Date(o.created_at);
      let key = '';

      if (granularity === 'DAILY') {
        key = formatDateToInput(d);
      } else if (granularity === 'WEEKLY') {
        const firstJan = new Date(d.getFullYear(), 0, 1);
        const weekNum = Math.ceil((((d.getTime() - firstJan.getTime()) / 86400000) + firstJan.getDay() + 1) / 7);
        key = `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
      } else if (granularity === 'MONTHLY') {
        key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      } else if (granularity === 'YEARLY') {
        key = `${d.getFullYear()}`;
      }

      if (!dateMap[key]) {
        dateMap[key] = { revenue: 0, orders: 0 };
      }
      dateMap[key].revenue += Number(o.total_amount || 0);
      dateMap[key].orders += 1;
    });

    const sortedKeys = Object.keys(dateMap).sort();

    return sortedKeys.map((key) => {
      const rev = dateMap[key].revenue;
      const ord = dateMap[key].orders;
      return {
        dateKey: key,
        label: formatDisplayDate(key),
        revenue: rev,
        orders: ord,
        aov: ord > 0 ? Math.round(rev / ord) : 0,
      };
    });
  }, [rawOrdersData, granularity]);

  const calcPercent = (val: number) => {
    if (!totalOrders || totalOrders <= 0) return 0;
    return Math.min(Math.max((val / totalOrders) * 100, 0), 100);
  };

  const validOrderCount = totalOrders - cancelledOrders;
  const avgOrderValue = validOrderCount > 0 ? Math.round(totalRevenue / validOrderCount) : 0;

  const statusItems = [
    { key: 'PENDING', label: 'PENDING', count: pendingOrders, color: '#facc15' },
    { key: 'PROC', label: 'PROC', count: processingOrders, color: '#c084fc' },
    { key: 'REC', label: 'REC', count: receivedOrders, color: '#60a5fa' },
    { key: 'SHIPPED', label: 'SHIPPED', count: shippedOrders, color: '#22d3ee' },
    { key: 'DELIVERED', label: 'DELIVERED', count: deliveredOrders, color: '#4ade80' },
    { key: 'CANCELLED', label: 'CANCELLED', count: cancelledOrders, color: '#f87171' },
  ];

  // Bezier Smooth Curve Generator
  const getSmoothPath = (pts: { x: number; y: number }[]) => {
    if (pts.length === 0) return '';
    if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;

    let path = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i === 0 ? i : i - 1];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2 < pts.length ? i + 2 : i + 1];

      const cp1x = p1.x + (p2.x - p0.x) * 0.15;
      const cp1y = p1.y + (p2.y - p0.y) * 0.15;
      const cp2x = p2.x - (p3.x - p1.x) * 0.15;
      const cp2y = p2.y - (p3.y - p1.y) * 0.15;

      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return path;
  };

  const renderSVGChart = () => {
    if (chartData.length === 0) {
      return (
        <div style={{ padding: '35px 0', textAlign: 'center', color: '#666', fontSize: '11px', letterSpacing: '1px' }}>
          NO TRANSACTION DATA AVAILABLE FOR SELECTED PERIOD
        </div>
      );
    }

    const svgWidth = 650;
    const svgHeight = 180;
    const paddingTop = 20;
    const paddingBottom = 30;
    const paddingLeft = 45;
    const paddingRight = 20;

    const chartInnerWidth = svgWidth - paddingLeft - paddingRight;
    const chartInnerHeight = svgHeight - paddingTop - paddingBottom;

    const getValue = (pt: ChartPoint) => {
      if (selectedMetric === 'REVENUE') return pt.revenue;
      if (selectedMetric === 'ORDERS') return pt.orders;
      return pt.aov;
    };

    const displayValues = chartData.map(getValue);
    const maxValue = Math.max(...displayValues, 1);

    const points = chartData.map((pt, index) => {
      const val = getValue(pt);
      const x =
        chartData.length === 1
          ? paddingLeft + chartInnerWidth / 2
          : paddingLeft + (index / (chartData.length - 1)) * chartInnerWidth;
      const y = svgHeight - paddingBottom - (val / maxValue) * chartInnerHeight;
      return { x, y, pt, val };
    });

    const smoothPathD = getSmoothPath(points);

    const areaD =
      points.length > 0
        ? `${smoothPathD} L ${points[points.length - 1].x} ${svgHeight - paddingBottom} L ${points[0].x} ${svgHeight - paddingBottom} Z`
        : '';

    const activePoint = hoveredIndex !== null ? points[hoveredIndex] : null;

    return (
      <div style={{ position: 'relative', width: '100%', overflowX: 'auto' }}>
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
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
                  y={yPos + 3}
                  fill="#555"
                  fontSize="9"
                  textAnchor="end"
                  fontFamily="monospace"
                >
                  {selectedMetric === 'ORDERS' ? formatNumber(gridVal) : `৳${formatNumber(gridVal)}`}
                </text>
              </g>
            );
          })}

          {/* Area & Line */}
          {areaD && <path d={areaD} fill="url(#chartGradient)" />}
          {smoothPathD && (
            <path
              d={smoothPathD}
              fill="none"
              stroke="#22d3ee"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Points & Hitboxes */}
          {points.map((p, i) => {
            const isHovered = hoveredIndex === i;
            const step = Math.max(1, Math.ceil(points.length / 7));
            const showLabel = points.length <= 10 || i === 0 || i === points.length - 1 || i % step === 0;

            return (
              <g key={i}>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isHovered ? '4.5' : '2.5'}
                  fill={isHovered ? '#22d3ee' : '#080808'}
                  stroke="#22d3ee"
                  strokeWidth={isHovered ? '2.5' : '1.5'}
                  style={{ transition: 'all 0.15s ease' }}
                />

                <rect
                  x={p.x - Math.max(chartInnerWidth / points.length / 2, 8)}
                  y={paddingTop}
                  width={Math.max(chartInnerWidth / points.length, 16)}
                  height={chartInnerHeight}
                  fill="transparent"
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() => setHoveredIndex(i)}
                />

                {showLabel && (
                  <text
                    x={p.x}
                    y={svgHeight - 8}
                    fill="#718096"
                    fontSize="8"
                    textAnchor="middle"
                    fontFamily="monospace"
                  >
                    {p.pt.label}
                  </text>
                )}
              </g>
            );
          })}

          {/* Hover Indicator */}
          {activePoint && (
            <line
              x1={activePoint.x}
              y1={paddingTop}
              x2={activePoint.x}
              y2={svgHeight - paddingBottom}
              stroke="#22d3ee"
              strokeWidth="1"
              strokeDasharray="2 2"
            />
          )}
        </svg>

        {/* Hover Tooltip */}
        {activePoint && (
          <div
            style={{
              position: 'absolute',
              top: `${(activePoint.y / svgHeight) * 100 - 20}%`,
              left: `${Math.min(Math.max((activePoint.x / svgWidth) * 100, 15), 85)}%`,
              transform: 'translate(-50%, -100%)',
              backgroundColor: '#111',
              border: '1px solid #22d3ee',
              padding: '6px 10px',
              borderRadius: '2px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.6)',
              pointerEvents: 'none',
              zIndex: 10,
              minWidth: '120px',
            }}
          >
            <div style={{ fontSize: '9px', color: '#888', fontWeight: 'bold', marginBottom: '3px' }}>
              {activePoint.pt.label}
            </div>
            <div style={{ fontSize: '11px', color: '#22d3ee', fontWeight: 'bold' }}>
              REV: ৳{formatNumber(activePoint.pt.revenue)}
            </div>
            <div style={{ fontSize: '10px', color: '#A0AEC0' }}>
              ORDERS: {activePoint.pt.orders}
            </div>
            <div style={{ fontSize: '10px', color: '#A0AEC0' }}>
              AOV: ৳{formatNumber(activePoint.pt.aov)}
            </div>
          </div>
        )}
      </div>
    );
  };

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
          padding: 6px 12px;
          cursor: pointer;
          border-radius: 2px;
          white-space: nowrap;
          transition: all 0.2s ease;
        }

        .preset-btn.active {
          background: #111;
          color: #22d3ee;
          border-color: #22d3ee;
        }

        .custom-date-inputs {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .date-input {
          background: #111;
          border: 1px solid #222;
          color: #FFFFFF;
          font-family: monospace;
          font-size: 11px;
          padding: 6px 8px;
          border-radius: 2px;
          outline: none;
          width: 100%;
        }

        .two-column-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
          margin-top: 10px;
        }

        .metric-card {
          background-color: #080808;
          border: 1px solid #222222;
          padding: 14px 12px;
          border-radius: 2px;
        }

        .status-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
        }

        .filter-toggle-btn {
          background: #111;
          border: 1px solid #222;
          color: #777;
          font-size: 9px;
          padding: 4px 8px;
          cursor: pointer;
          border-radius: 2px;
        }

        .filter-toggle-btn.active {
          background: #22d3ee;
          color: #000;
          border-color: #22d3ee;
          font-weight: bold;
        }

        @media (min-width: 640px) {
          .status-grid { grid-template-columns: repeat(3, 1fr); }
        }

        @media (min-width: 1024px) {
          .date-filter-container {
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
          }
          .custom-date-inputs { width: auto; }
          .date-input { width: 135px; }
        }
      `}</style>

      {/* Clean Presets Filter Bar */}
      <div className="date-filter-container">
        <div className="preset-buttons">
          {['ALL', 'TODAY', '7D', '30D'].map((p) => (
            <button
              key={p}
              className={`preset-btn ${selectedPreset === p ? 'active' : ''}`}
              onClick={() => handlePresetSelect(p)}
            >
              {p === 'ALL' ? 'ALL TIME' : p === '7D' ? '7 DAYS' : p === '30D' ? '30 DAYS' : p}
            </button>
          ))}
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
          <span style={{ color: '#666', fontSize: '11px', fontWeight: 'bold' }}>TO</span>
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

      {/* Fulfillment Status */}
      <div style={{ backgroundColor: '#080808', border: '1px solid #222', padding: '14px', borderRadius: '2px' }}>
        <span style={{ fontSize: '14px', color: '#CBD5E0', letterSpacing: '1px', fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>
          FULFILLMENT STATUS
        </span>

        <div style={{ display: 'flex', height: '4px', backgroundColor: '#181818', borderRadius: '2px', overflow: 'hidden', marginBottom: '12px' }}>
          <div style={{ width: `${calcPercent(pendingOrders)}%`, backgroundColor: '#facc15' }} />
          <div style={{ width: `${calcPercent(processingOrders)}%`, backgroundColor: '#c084fc' }} />
          <div style={{ width: `${calcPercent(receivedOrders)}%`, backgroundColor: '#60a5fa' }} />
          <div style={{ width: `${calcPercent(shippedOrders)}%`, backgroundColor: '#22d3ee' }} />
          <div style={{ width: `${calcPercent(deliveredOrders)}%`, backgroundColor: '#4ade80' }} />
          <div style={{ width: `${calcPercent(cancelledOrders)}%`, backgroundColor: '#f87171' }} />
        </div>

        <div className="status-grid">
          {statusItems.map((item) => (
            <div key={item.key}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <span style={{ color: item.count === 0 ? '#444' : item.color, fontSize: '10px' }}>●</span>
                <span style={{ fontSize: '12px', color: '#A0AEC0', fontWeight: 'bold' }}>{item.label}</span>
              </div>
              <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                {formatNumber(item.count)} <span style={{ fontSize: '10px', color: '#718096' }}>({calcPercent(item.count).toFixed(0)}%)</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Metric Cards */}
      {canViewSensitiveData && (
        <div className="two-column-grid">
          <div className="metric-card">
            <span style={{ fontSize: '12px', color: '#A0AEC0' }}>TOTAL REVENUE</span>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#FFFFFF', marginTop: '4px' }}>৳{formatNumber(totalRevenue)}</div>
          </div>
          <div className="metric-card">
            <span style={{ fontSize: '12px', color: '#A0AEC0' }}>AVG ORDER VALUE (AOV)</span>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#FFFFFF', marginTop: '4px' }}>৳{formatNumber(avgOrderValue)}</div>
          </div>
        </div>
      )}

      <div className="two-column-grid">
        <div className="metric-card">
          <span style={{ fontSize: '12px', color: '#A0AEC0' }}>TOTAL ORDERS</span>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#FFFFFF', marginTop: '4px' }}>{formatNumber(totalOrders)}</div>
        </div>
        <div className="metric-card">
          <span style={{ fontSize: '12px', color: '#A0AEC0' }}>ACTIVE QUEUE</span>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#FFFFFF', marginTop: '4px' }}>
            {formatNumber(pendingOrders + processingOrders)} <span style={{ fontSize: '12px', color: '#718096' }}>/ {formatNumber(receivedOrders)} REC</span>
          </div>
        </div>
      </div>

      <div className="two-column-grid">
        <div className="metric-card">
          <span style={{ fontSize: '12px', color: '#A0AEC0' }}>CATALOG ITEMS</span>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#FFFFFF', marginTop: '4px' }}>{formatNumber(activeCatalogItems)}</div>
        </div>
        <div className="metric-card">
          <span style={{ fontSize: '12px', color: '#A0AEC0' }}>TOTAL USERS</span>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#FFFFFF', marginTop: '4px' }}>{formatNumber(totalUsers)}</div>
        </div>
      </div>

      {/* Graph Section */}
      {canViewSensitiveData && (
        <div style={{ backgroundColor: '#080808', border: '1px solid #222', padding: '14px', borderRadius: '2px', marginTop: '10px' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', color: '#CBD5E0', fontWeight: 'bold', letterSpacing: '1px' }}>
              ANALYTICS TREND
            </span>

            {/* Metric Mode Switcher */}
            <div style={{ display: 'flex', gap: '4px' }}>
              {(['REVENUE', 'ORDERS', 'AOV'] as MetricType[]).map((m) => (
                <button
                  key={m}
                  className={`filter-toggle-btn ${selectedMetric === m ? 'active' : ''}`}
                  onClick={() => setSelectedMetric(m)}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {renderSVGChart()}
        </div>
      )}
    </div>
  );
};

export default AdminOverview;
