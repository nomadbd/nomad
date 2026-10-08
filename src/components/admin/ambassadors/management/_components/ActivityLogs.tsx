import React, { useEffect, useState } from 'react';
import { ChevronLeft, Clock, UserCircle } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient'; // আপনার প্রোজেক্টের সুপাবেস ক্লায়েন্ট পাথ

interface AuditLog {
  id: string;
  action_type: string;
  field_name: string | null;
  old_value: string | null;
  new_value: string | null;
  changes: Record<string, any> | null;
  reason: string | null;
  metadata: {
    admin_email?: string;
    admin_role?: string;
    [key: string]: any;
  } | null;
  created_at: string;
  performed_by: string | null;
}

interface Props {
  ambassadorId: string;
  onBack: () => void;
}

export const ActivityLogs: React.FC<Props> = ({ ambassadorId, onBack }) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchLogs();
  }, [ambassadorId]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('ambassador_id', ambassadorId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLogs(data || []);
    } catch (err) {
      console.error('Error fetching activity logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const getBadgeStyle = (type: string) => {
    switch (type?.toUpperCase()) {
      case 'RATE_UPDATE':
      case 'COMMISSION_CHANGE':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'STATUS_CHANGE':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'PRODUCT_ASSIGN':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'COMMUNICATION':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      default:
        return 'bg-zinc-800 text-zinc-300 border-zinc-700';
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="flex flex-col h-full bg-zinc-900 text-zinc-100 rounded-t-2xl">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-zinc-800 sticky top-0 bg-zinc-900/95 backdrop-blur z-10">
        <button
          onClick={onBack}
          className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h3 className="text-base font-semibold text-zinc-100">Activity & Audit Logs</h3>
          <p className="text-xs text-zinc-400">অ্যাম্বাসেডরের সমস্ত আপডেটের ইতিহাস</p>
        </div>
      </div>

      {/* Log List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-zinc-500 text-sm">
            লগ লোড হচ্ছে...
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-zinc-500 text-sm">
            <Clock className="w-8 h-8 mb-2 opacity-40" />
            কোনো একটিভিটি হিস্ট্রি পাওয়া যায়নি
          </div>
        ) : (
          logs.map((log) => {
            const adminEmail = log.metadata?.admin_email || 'System / Admin';
            const adminRole = log.metadata?.admin_role || 'Admin';

            return (
              <div
                key={log.id}
                className="p-3.5 rounded-xl bg-zinc-800/50 border border-zinc-800 space-y-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${getBadgeStyle(
                      log.action_type
                    )}`}
                  >
                    {log.action_type || 'UPDATE'}
                  </span>
                  <span className="text-[11px] text-zinc-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDate(log.created_at)}
                  </span>
                </div>

                <div className="text-sm text-zinc-200">
                  {log.field_name && (
                    <div className="font-medium text-zinc-300 mb-1">
                      {log.field_name.toUpperCase()}
                    </div>
                  )}

                  {log.old_value || log.new_value ? (
                    <div className="flex items-center gap-2 text-xs font-mono bg-zinc-900/60 p-2 rounded-lg border border-zinc-800/80">
                      <span className="text-red-400/80 line-through">
                        {log.old_value || 'None'}
                      </span>
                      <span className="text-zinc-500">➔</span>
                      <span className="text-emerald-400 font-semibold">
                        {log.new_value || 'None'}
                      </span>
                    </div>
                  ) : log.reason ? (
                    <p className="text-xs text-zinc-300">{log.reason}</p>
                  ) : null}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-zinc-800/60 text-[11px] text-zinc-400">
                  <div className="flex items-center gap-1.5">
                    <UserCircle className="w-3.5 h-3.5 text-zinc-500" />
                    <span>{adminEmail}</span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.2 bg-zinc-800 rounded text-zinc-400 uppercase font-mono">
                    {adminRole}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
