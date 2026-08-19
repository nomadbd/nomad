import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../../supabaseClient';
import './admin-animations.css';

interface AdminOverviewProps {
  userRole?: string;
  showFilter?: boolean;
  dateFormat?: string;
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
  if (typeof num !== 'number' || isNaN(num)) return '0';
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return num.toLocaleString();
};

const AdminOverview: React.FC<AdminOverviewProps> = ({ 
  userRole = '', 
  showFilter = false,
  dateFormat = 'DD/MM/YYYY'
}) => {
  const normalizedRole = userRole.toUpperCase().trim();
  const canViewSensitiveData = ['SUPER_ADMIN', 'ADMIN'].includes(normalizedRole);

  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedPreset, setSelectedPreset] = useState<string>('30D');

  const [selectedMetric, setSelectedMetric] = useState<MetricType>('REVENUE');
  const [granularity, setGranularity] = useState<GranularityType>('DAILY');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const [totalRevenue, setTotalRevenue] = useState<number>(0);
  const [cancelledRevenue, setCancelledRevenue] = useState<number>(0);

  const [totalOrders, setTotalOrders] = useState<number>(0);
  const [pendingOrders, setPendingOrders] = useState<number>(0);
  const [processingOrders, setProcessingOrders] = useState<number>(0);
  const [receivedOrders, setReceivedOrders] = useState<number>(0);
  const [shippedOrders, setShippedOrders] = useState<number>(0);
  const [deliveredOrders, setDeliveredOrders] = useState<number>(0);
  const [cancelledOrders, setCancelledOrders] = useState<number>(0);

  const [activeCatalogItems, setActiveCatalogItems] = useState<number>(0);
  const [outOfStockItems, setOutOfStockItems] = useState<number>(0);
  const [lowStockItems, setLowStockItems] = useState<number>(0);

  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [newUsers, setNewUsers] = useState<number>(0);

  const [rawOrdersData, setRawOrdersData] = useState<any[]>([]);

  const formatDateToInput = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDateForUI = (dateStr: string) => {
    if (!dateStr) return 'DD / MM / YYYY';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const [year, month, day] = parts;
    if (dateFormat === 'DD/MM/YYYY') {
      return `${day} / ${month} / ${year}`;
    }
    return `${month} / ${day} / ${year}`;
  };

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 1) return parts[0];
    if (parts.length === 2) {
      if (parts[1].startsWith('W')) {
        return `${parts[0]} ${parts[1]}`;
      }
      const date = new Date(Number(parts[0]), Number(parts[1]) - 1, 1);
      return date.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' }).toUpperCase();
    }
    const [year, month, day] = parts.map(Number);
    const d = String(day).padStart(2, '0');
    const m = String(month).padStart(2, '0');
    if (dateFormat === 'DD/MM/YYYY') {
      return `${d}/${m}/${year}`;
    }
    return `${m}/${d}/${year}`;
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
    } else if (preset === 'ALL') {
      setStartDate('');
      setEndDate('');
    }
  };

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
    else if (diffDays <= 1095) setGranularity('MONTHLY');
    else setGranularity('YEARLY');
  }, [startDate, endDate]);

  useEffect(() => {
    handlePresetSelect('30D');
  }, []);

  const fetchMetricsData = async () => {
    try {
      const p_start = startDate && startDate.trim() !== '' ? `${startDate}T00:00:00.000Z` : null;
      const p_end = endDate && endDate.trim() !== '' ? `${endDate}T23:59:59.999Z` : null;

      const ordersPromise = (async () => {
        const { data: rpcOrders, error: rpcErr } = await supabase.rpc('get_admin_overview_orders', {
          p_start_date: p_start,
          p_end_date: p_end
        });

        if (!rpcErr && rpcOrders) {
          return rpcOrders;
        } else {
          let ordersQuery = supabase
            .from('orders')
            .select('status, total_amount, created_at')
            .order('created_at', { ascending: false })
            .limit(3000);

          if (p_start) ordersQuery = ordersQuery.gte('created_at', p_start);
          if (p_end) ordersQuery = ordersQuery.lte('created_at', p_end);
          const { data: fallbackOrders } = await ordersQuery;
          return fallbackOrders || [];
        }
      })();

      const productCountPromise = supabase.from('products').select('*', { count: 'exact', head: true });
      const outOfStockPromise = supabase.from('products').select('*', { count: 'exact', head: true }).lte('stock_quantity', 0);
      const lowStockPromise = supabase.from('products').select('*', { count: 'exact', head: true }).gt('stock_quantity', 0).lte('stock_quantity', 5);
      const allUsersPromise = supabase.from('profiles').select('*', { count: 'exact', head: true }).not('role', 'in', '(admin,manager)');

      let newUsersQuery = supabase.from('profiles').select('*', { count: 'exact', head: true }).not('role', 'in', '(admin,manager)');
      if (startDate) newUsersQuery = newUsersQuery.gte('created_at', `${startDate}T00:00:00.000Z`);
      if (endDate) newUsersQuery = newUsersQuery.lte('created_at', `${endDate}T23:59:59.999Z`);

      const [
        orders,
        { count: productCount },
        { count: outOfStockCount },
        { count: lowStockCount },
        { count: allUsersCount },
        { count: newUsersCount }
      ] = await Promise.all([
        ordersPromise,
        productCountPromise,
        outOfStockPromise,
        lowStockPromise,
        allUsersPromise,
        newUsersQuery
      ]);

      let revenue = 0;
      let c_revenue = 0;
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
        } else {
          c_revenue += Number(o.total_amount || 0);
        }
      });

      setRawOrdersData(orders);
      setTotalOrders(orders.length);
      setTotalRevenue(revenue);
      setCancelledRevenue(c_revenue);
      setPendingOrders(pending);
      setProcessingOrders(processing);
      setReceivedOrders(received);
      setShippedOrders(shipped);
      setDeliveredOrders(delivered);
      setCancelledOrders(cancelled);

      if (productCount !== null) setActiveCatalogItems(productCount);
      if (outOfStockCount !== null) setOutOfStockItems(outOfStockCount);
      if (lowStockCount !== null) setLowStockItems(lowStockCount);
      if (allUsersCount !== null) setTotalUsers(allUsersCount);
      if (newUsersCount !== null) setNewUsers(newUsersCount);

    } catch (err) {
      console.error('Error fetching analytics:', err);
    }
  };

  useEffect(() => {
    fetchMetricsData();

    let debounceTimer: NodeJS.Timeout;

    const ordersSubscription = supabase
      .channel('admin-overview-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          fetchMetricsData();
        }, 1500);
      })
      .subscribe();

    return () => {
      clearTimeout(debounceTimer);
      supabase.removeChannel(ordersSubscription);
    };
  }, [startDate, endDate]);

  const chartData = useMemo(() => {
    if (!rawOrdersData) return [];

    let startD = startDate ? new Date(`${startDate}T00:00:00`) : null;
    let endD = endDate ? new Date(`${endDate}T23:59:59`) : new Date();

    if (!startD && rawOrdersData.length > 0) {
      const timestamps = rawOrdersData
        .map((o) => new Date(o.created_at).getTime())
        .filter((t) => !isNaN(t));
      if (timestamps.length > 0) {
        startD = new Date(Math.min(...timestamps));
      }
    }

    if (!startD) {
      startD = new Date();
      startD.setDate(startD.getDate() - 30);
    }

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

    const resultKeys: string[] = [];
    const curr = new Date(startD);
    if (granularity === 'MONTHLY') {
      curr.setDate(1);
    } else if (granularity === 'YEARLY') {
      curr.setMonth(0, 1);
    }

    while (curr <= endD) {
      let key = '';
      if (granularity === 'DAILY') {
        key = formatDateToInput(curr);
        curr.setDate(curr.getDate() + 1);
      } else if (granularity === 'WEEKLY') {
        const firstJan = new Date(curr.getFullYear(), 0, 1);
        const weekNum = Math.ceil((((curr.getTime() - firstJan.getTime()) / 86400000) + firstJan.getDay() + 1) / 7);
        key = `${curr.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
        curr.setDate(curr.getDate() + 7);
      } else if (granularity === 'MONTHLY') {
        key = `${curr.getFullYear()}-${String(curr.getMonth() + 1).padStart(2, '0')}`;
        curr.setMonth(curr.getMonth() + 1);
      } else if (granularity === 'YEARLY') {
        key = `${curr.getFullYear()}`;
        curr.setFullYear(curr.getFullYear() + 1);
      }

      if (key && !resultKeys.includes(key)) {
        resultKeys.push(key);
      }
    }

    return resultKeys.map((key) => {
      const rev = dateMap[key]?.revenue || 0;
      const ord = dateMap[key]?.orders || 0;
      return {
        dateKey: key,
        label: formatDisplayDate(key),
        revenue: rev,
        orders: ord,
        aov: ord > 0 ? Math.round(rev / ord) : 0,
      };
    });
  }, [rawOrdersData, granularity, startDate, endDate, dateFormat]);

  const calcPercent = (val: number) => {
    if (!totalOrders || totalOrders <= 0 || typeof val !== 'number' || isNaN(val)) return 0;
    return Math.min(Math.max((val / totalOrders) * 100, 0), 100);
  };

  const validOrderCount = totalOrders - cancelledOrders;
  const avgOrderValue = validOrderCount > 0 ? Math.round(totalRevenue / validOrderCount) : 0;

  const statusItems = [
    { key: 'PENDING', label: 'PENDING', count: pendingOrders, color: '#FFB800' },
    { key: 'REC', label: 'REC', count: receivedOrders, color: '#7C4DFF' },
    { key: 'PROC', label: 'PROC', count: processingOrders, color: '#E040FB' },
    { key: 'SHIPPED', label: 'SHIPPED', count: shippedOrders, color: '#00B0FF' },
    { key: 'DELIVERED', label: 'DELIVERED', count: deliveredOrders, color: '#008000' },
    { key: 'CANCELLED', label: 'CANCELLED', count: cancelledOrders, color: '#FF5252' },
  ];

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
    const svgHeight = 240;
    const paddingTop = 35;
    const paddingBottom = 45;
    const paddingLeft = 60;
    const paddingRight = 20;

    const chartInnerWidth = svgWidth - paddingLeft - paddingRight;
    const chartInnerHeight = svgHeight - paddingTop - paddingBottom;

    const getValue = (pt: ChartPoint) => {
      if (selectedMetric === 'REVENUE') return pt.revenue;
      if (selectedMetric === 'ORDERS') return pt.orders;
      return pt.aov;
    };

    const displayValues = chartData.map(getValue);
    const rawMax = Math.max(...displayValues, 0);

    const maxValue = selectedMetric === 'ORDERS' 
      ? Math.max(rawMax * 1.3, 4) 
      : Math.max(rawMax * 1.25, 100);

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
    const showBelow = activePoint ? activePoint.y < 110 : false;

    const step = points.length > 30 ? 4 : points.length > 15 ? 2 : 1;

    const getXAxisTickLabel = (pt: ChartPoint) => {
      if (granularity === 'DAILY') {
        const parts = pt.dateKey.split('-');
        if (parts.length === 3) return parts[2];
      }
      return pt.label;
    };

    const yCenter = paddingTop + chartInnerHeight / 2;

    return (
      <div style={{ position: 'relative', width: '100%', padding: '8px 0', overflow: 'hidden' }}>
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

          <text
            x={12}
            y={yCenter}
            fill="#718096"
            fontSize="9"
            textAnchor="middle"
            fontFamily="monospace"
            fontWeight="bold"
            transform={`rotate(90, 12, ${yCenter})`}
          >
            {selectedMetric} ({selectedMetric === 'ORDERS' ? 'COUNT' : 'AMOUNT ৳'})
          </text>

          {[0, 0.5, 1].map((ratio, idx) => {
            const yPos = svgHeight - paddingBottom - ratio * chartInnerHeight;
            const gridVal = Math.round(ratio * maxValue);
            return (
              <g key={idx}>
                <line x1={paddingLeft} y1={yPos} x2={svgWidth - paddingRight} y2={yPos} stroke="#1b1b1b" strokeDasharray="3 3" />
                <text x={paddingLeft - 8} y={yPos + 3} fill="#555" fontSize="9" textAnchor="end" fontFamily="monospace">
                  {selectedMetric === 'ORDERS' ? formatNumber(gridVal) : `৳${formatNumber(gridVal)}`}
                </text>
              </g>
            );
          })}

          {areaD && <path d={areaD} fill="url(#chartGradient)" style={{ transition: 'd 0.5s cubic-bezier(0.16, 1, 0.3, 1)' }} />}
          {smoothPathD && (
            <path d={smoothPathD} fill="none" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'd 0.5s cubic-bezier(0.16, 1, 0.3, 1)' }} />
          )}

          {points.map((p, i) => {
            const isHovered = hoveredIndex === i;
            const showLabel = points.length < 4 ? true : i % step === 0;

            return (
              <g key={i}>
                <circle
                  cx={p.x} cy={p.y} r={isHovered ? '5' : p.val > 0 ? '2.5' : '1.5'}
                  fill={isHovered ? '#22d3ee' : p.val > 0 ? '#22d3ee' : '#111'}
                  stroke="#22d3ee" strokeWidth={isHovered ? '2.5' : '1'}
                  style={{ transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}
                />

                <rect
                  x={p.x - Math.max(chartInnerWidth / points.length / 2, 6)} y={paddingTop}
                  width={Math.max(chartInnerWidth / points.length, 12)} height={chartInnerHeight}
                  fill="transparent" style={{ cursor: 'pointer' }} onMouseEnter={() => setHoveredIndex(i)}
                  onTouchStart={() => setHoveredIndex(i)}
                />

                {showLabel && (
                  <text x={p.x} y={svgHeight - 24} fill="#718096" fontSize="9" textAnchor="middle" fontFamily="monospace">
                    {getXAxisTickLabel(p.pt)}
                  </text>
                )}
              </g>
            );
          })}

          <text x={paddingLeft + chartInnerWidth / 2} y={svgHeight - 4} fill="#718096" fontSize="9" textAnchor="middle" fontFamily="monospace" fontWeight="bold">
            Date
          </text>

          {activePoint && (
            <line x1={activePoint.x} y1={paddingTop} x2={activePoint.x} y2={svgHeight - paddingBottom} stroke="#22d3ee" strokeWidth="1" strokeDasharray="2 2" />
          )}
        </svg>

        {activePoint && (
          <div
            style={{
              position: 'absolute',
              top: `${(activePoint.y / svgHeight) * 100}%`,
              left: `${Math.min(Math.max((activePoint.x / svgWidth) * 100, 22), 78)}%`,
              transform: showBelow ? 'translate(-50%, 12px)' : 'translate(-50%, calc(-100% - 12px))',
              backgroundColor: '#0c0c0c', 
              border: '1px solid #22d3ee', 
              padding: '8px 12px',
              borderRadius: '4px', 
              boxShadow: '0 8px 24px rgba(0,0,0,0.95)', 
              pointerEvents: 'none',
              zIndex: 30, 
              minWidth: '140px',
              backdropFilter: 'blur(8px)',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            <div style={{ fontSize: '10px', color: '#888', fontWeight: 'bold', marginBottom: '4px', letterSpacing: '0.5px' }}>
              {activePoint.pt.label}
            </div>
            <div style={{ fontSize: '12px', color: '#22d3ee', fontWeight: 'bold', marginBottom: '2px' }}>
              REV: ৳{formatNumber(activePoint.pt.revenue)}
            </div>
            <div style={{ fontSize: '10px', color: '#A0AEC0', marginBottom: '1px' }}>
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

      <div className={`filter-expand-wrapper ${showFilter ? 'open' : ''}`}>
        <div className="filter-expand-content">
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
              <div className="date-input-field">
                <span className={`date-display-label ${selectedPreset === 'CUSTOM' ? 'active-input' : ''}`}>
                  {formatDateForUI(startDate)}
                </span>
                <input
                  type="date"
                  className="date-input-picker"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setSelectedPreset('CUSTOM');
                  }}
                />
              </div>

              <span style={{ color: '#444', fontSize: '11px', fontWeight: 'bold' }}>TO</span>

              <div className="date-input-field">
                <span className={`date-display-label ${selectedPreset === 'CUSTOM' ? 'active-input' : ''}`}>
                  {formatDateForUI(endDate)}
                </span>
                <input
                  type="date"
                  className="date-input-picker"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setSelectedPreset('CUSTOM');
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="animate-card" style={{ backgroundColor: '#080808', border: '1px solid #222', padding: '14px', borderRadius: '2px', width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
        <span style={{ fontSize: '14px', color: '#CBD5E0', letterSpacing: '1px', fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>
          FULFILLMENT STATUS
        </span>

        <div style={{ display: 'flex', width: '100%', maxWidth: '100%', height: '4px', backgroundColor: '#181818', borderRadius: '2px', overflow: 'hidden', marginBottom: '12px' }}>
          <div className="status-bar-segment" style={{ width: `${calcPercent(pendingOrders)}%`, backgroundColor: '#FFB800', flexShrink: 0 }} />
          <div className="status-bar-segment" style={{ width: `${calcPercent(receivedOrders)}%`, backgroundColor: '#7C4DFF', flexShrink: 0 }} />
          <div className="status-bar-segment" style={{ width: `${calcPercent(processingOrders)}%`, backgroundColor: '#E040FB', flexShrink: 0 }} />
          <div className="status-bar-segment" style={{ width: `${calcPercent(shippedOrders)}%`, backgroundColor: '#00B0FF', flexShrink: 0 }} />
          <div className="status-bar-segment" style={{ width: `${calcPercent(deliveredOrders)}%`, backgroundColor: '#008000', flexShrink: 0 }} />
          <div className="status-bar-segment" style={{ width: `${calcPercent(cancelledOrders)}%`, backgroundColor: '#FF5252', flexShrink: 0 }} />
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

      {canViewSensitiveData && (
        <div className="animate-card" style={{ backgroundColor: '#080808', border: '1px solid #222', padding: '18px 16px', borderRadius: '2px', marginTop: '10px', position: 'relative', width: '100%', maxWidth: '100%', overflow: 'hidden' }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
            <span style={{ fontSize: '13px', color: '#CBD5E0', fontWeight: 'bold', letterSpacing: '1px' }}>
              ANALYTICS TREND
            </span>

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
