import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../../supabaseClient';
import { ChartPoint, MetricType, GranularityType } from './adminOverview.types';
import { formatDateToInput, formatDisplayDate } from './adminOverview.utils';

export const useAdminOverview = (dateFormat: string = 'DD/MM/YYYY') => {
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedPreset, setSelectedPreset] = useState<string>('30D');

  const [selectedMetric, setSelectedMetric] = useState<MetricType>('REVENUE');
  const [granularity, setGranularity] = useState<GranularityType>('DAILY');

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

  const chartData: ChartPoint[] = useMemo(() => {
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
        label: formatDisplayDate(key, dateFormat),
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

  return {
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
  };
};
