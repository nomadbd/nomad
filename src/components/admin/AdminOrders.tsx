import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { ChevronDown, ChevronUp, History, Clock, User, CheckCircle2 } from 'lucide-react';

interface AuditLog {
  id: string;
  order_id: string;
  action: string;
  details: string;
  performed_by?: string;
  created_at: string;
}

interface Order {
  id: string;
  status: string;
  courier_name?: string;
  tracking_id?: string;
  admin_notes?: string;
  customer_notes?: string;
  created_at: string;
  [key: string]: any;
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Audit Logs-এর জন্য স্টেট
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [auditLogs, setAuditLogs] = useState<{ [orderId: string]: AuditLog[] }>({});
  const [loadingLogs, setLoadingLogs] = useState<{ [orderId: string]: boolean }>({});

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setOrders(data);
    }
    setLoading(false);
  };

  // ১. audit_logs ফেচ করার ফাংশন
  const fetchAuditLogs = async (orderId: string) => {
    setLoadingLogs((prev) => ({ ...prev, [orderId]: true }));
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setAuditLogs((prev) => ({ ...prev, [orderId]: data }));
    }
    setLoadingLogs((prev) => ({ ...prev, [orderId]: false }));
  };

  // ২. অ্যাকশন হলে audit_logs টেবিলে ইনসার্ট করার ফাংশন
  const logAction = async (orderId: string, action: string, details: string) => {
    const userResponse = await supabase.auth.getUser();
    const userEmail = userResponse.data.user?.email || 'Admin';

    const newLog = {
      order_id: orderId,
      action: action,
      details: details,
      performed_by: userEmail,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase.from('audit_logs').insert([newLog]).select();

    if (!error && data) {
      setAuditLogs((prev) => ({
        ...prev,
        [orderId]: [data[0], ...(prev[orderId] || [])],
      }));
    }
  };

  // ৩. Expand / Collapse টগল ফাংশন
  const toggleExpandLog = (orderId: string) => {
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null);
    } else {
      setExpandedOrderId(orderId);
      fetchAuditLogs(orderId);
    }
  };

  // ৪. স্ট্যাটাস পরিবর্তন ও অ্যাকশন লগ তৈরি
  const handleStatusChange = async (orderId: string, newStatus: string, oldStatus: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId);

    if (!error) {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
      await logAction(
        orderId, 
        'STATUS_UPDATE', 
        `স্ট্যাটাস "${oldStatus}" থেকে বদলে "${newStatus}" করা হয়েছে।`
      );
    }
  };

  // ৫. কুরিয়ার বা অন্যান্য ডিটেইলস আপডেট
  const handleUpdateDetails = async (orderId: string, updatedFields: Partial<Order>, logDescription: string) => {
    const { error } = await supabase
      .from('orders')
      .update(updatedFields)
      .eq('id', orderId);

    if (!error) {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, ...updatedFields } : o))
      );
      await logAction(orderId, 'DETAILS_UPDATE', logDescription);
    }
  };

  if (loading) return <div className="p-6 text-center">লোডিং হচ্ছে...</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold mb-6">অর্ডার ম্যানেজমেন্ট</h1>

      {orders.map((order) => {
        const isExpanded = expandedOrderId === order.id;
        const logs = auditLogs[order.id] || [];
        const isLoadingThisLog = loadingLogs[order.id];

        return (
          <div key={order.id} className="bg-white border rounded-lg shadow-sm overflow-hidden">
            {/* মূল অর্ডার বিবরণী (আপনার আগের UI ঠিক রাখা হয়েছে) */}
            <div className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b">
              <div>
                <span className="text-sm text-gray-500">অর্ডার ID: #{order.id}</span>
                <h3 className="font-semibold text-lg">স্ট্যাটাস: {order.status}</h3>
                <p className="text-xs text-gray-400">
                  তৈরি: {new Date(order.created_at).toLocaleString('bn-BD')}
                </p>
              </div>

              {/* স্ট্যাটাস পরিবর্তনের ড্রপডাউন এক্সাম্পল */}
              <div className="flex items-center gap-2">
                <select
                  value={order.status}
                  onChange={(e) => handleStatusChange(order.id, e.target.value, order.status)}
                  className="border rounded px-3 py-1.5 text-sm bg-gray-50"
                >
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            {/* Expandable Action Timeline Button (প্রস্তাব ১ অনুযায়ী) */}
            <div className="bg-gray-50 px-4 py-2 border-t flex justify-between items-center text-sm">
              <button
                onClick={() => toggleExpandLog(order.id)}
                className="flex items-center gap-1.5 text-blue-600 hover:text-blue-800 font-medium transition-colors"
              >
                <History className="w-4 h-4" />
                {isExpanded ? 'অ্যাক্টিভিটি লগ লুকান' : 'অ্যাক্টিভিটি লগ দেখুন (কখন কী করা হয়েছে)'}
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>

            {/* Expandable Audit Log Section */}
            {isExpanded && (
              <div className="p-4 bg-slate-50 border-t space-y-3">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> পরিবর্তন ও অ্যাকশন ইতিহাস
                </h4>

                {isLoadingThisLog ? (
                  <p className="text-xs text-gray-400 py-2">লগ লোড হচ্ছে...</p>
                ) : logs.length === 0 ? (
                  <p className="text-xs text-gray-400 py-2">এখনও কোনো পরিবর্তনের রেকর্ড নেই।</p>
                ) : (
                  <div className="relative border-l-2 border-blue-200 ml-3 pl-4 space-y-3 my-2">
                    {logs.map((log) => (
                      <div key={log.id} className="relative text-xs space-y-0.5">
                        {/* টাইমলাইন পয়েন্টার */}
                        <div className="absolute -left-[21px] top-0.5 w-2.5 h-2.5 rounded-full bg-blue-500 border-2 border-white" />
                        
                        <div className="flex items-center gap-2 font-medium text-gray-700">
                          <span>{log.details}</span>
                        </div>
                        
                        <div className="flex items-center gap-3 text-[11px] text-gray-400">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" /> {log.performed_by || 'Admin'}
                          </span>
                          <span>•</span>
                          <span>{new Date(log.created_at).toLocaleString('bn-BD')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
