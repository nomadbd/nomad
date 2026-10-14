import React, { useState } from 'react';
import { supabase } from './supabaseClient'; // আপনার Supabase Client path

interface StaffConfigProps {
  currentAdminId: string; // বর্তমান লগইন করা অ্যাডমিনের ID
  staff: {
    id: string;
    name: string;
    email: string;
    designation: string;
    role: 'SUPER_ADMIN' | 'ADMIN' | 'STAFF';
  };
  onSuccess: () => void;
}

export const StaffConfiguration: React.FC<StaffConfigProps> = ({ currentAdminId, staff, onSuccess }) => {
  const [designation, setDesignation] = useState(staff.designation);
  const [role, setRole] = useState(staff.role);
  const [password, setPassword] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<'SAVE' | 'REVOKE' | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSelf = currentAdminId === staff.id;
  const isChanged = designation !== staff.designation || role !== staff.role;

  // ১. সিকিউরিটি সেফগার্ড ও পাসওয়ার্ড ভ্যালিডেশন
  const verifyPasswordAndExecute = async () => {
    setLoading(true);
    setError(null);

    // পাসওয়ার্ড ভেরিফিকেশন (Current Admin Authentication)
    const { data: { user } } = await supabase.auth.getUser();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: user?.email || '',
      password: password,
    });

    if (authError) {
      setError('ভুল পাসওয়ার্ড! আবার চেষ্টা করুন।');
      setLoading(false);
      return;
    }

    // ২. অ্যাকশন এক্সিকিউশন
    try {
      if (pendingAction === 'SAVE') {
        // রোল বা পদবী আপডেট
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ designation, role })
          .eq('id', staff.id);

        if (updateError) throw updateError;

        // অডিট লগ তৈরি (Audit Log)
        await supabase.from('audit_logs').insert({
          performed_by: currentAdminId,
          target_user: staff.id,
          action: 'UPDATE_STAFF_CONFIG',
          details: { old_role: staff.role, new_role: role, designation },
        });

      } else if (pendingAction === 'REVOKE') {
        // অ্যাক্সেস রিভোক (Role 'REVOKED' বা Disabled সেট করা)
        const { error: revokeError } = await supabase
          .from('profiles')
          .update({ role: 'REVOKED', is_active: false })
          .eq('id', staff.id);

        if (revokeError) throw revokeError;

        await supabase.from('audit_logs').insert({
          performed_by: currentAdminId,
          target_user: staff.id,
          action: 'REVOKE_STAFF_ACCESS',
        });
      }

      setIsModalOpen(false);
      setPassword('');
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'অপারেশন ব্যর্থ হয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#121212] text-white p-6 rounded-2xl w-full max-w-md border border-zinc-800">
      {/* ইউজার হেডার */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-zinc-300 border border-zinc-700">
          {staff.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
        </div>
        <div className="overflow-hidden">
          <h3 className="font-semibold text-lg text-zinc-100">{staff.name}</h3>
          <p className="text-zinc-400 text-sm truncate">{staff.email}</p>
        </div>
      </div>

      {/* কনফিগারেশন ইনপুট */}
      <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800/80 mb-4 space-y-4">
        <span className="text-xs font-mono text-zinc-400 tracking-wider uppercase block mb-2">Staff Configuration</span>
        
        <div>
          <label className="text-xs text-zinc-400 block mb-1">DESIGNATION</label>
          <input 
            type="text" 
            value={designation} 
            onChange={(e) => setDesignation(e.target.value)}
            className="w-full bg-black/60 border border-zinc-800 rounded-lg p-2.5 text-emerald-400 font-mono text-sm focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div>
          <label className="text-xs text-zinc-400 block mb-1">SYSTEM ROLE</label>
          <select 
            value={role} 
            disabled={isSelf} // নিজেকে নিজে চেঞ্জ করার সেফগার্ড
            onChange={(e) => setRole(e.target.value as any)}
            className="w-full bg-black/60 border border-zinc-800 rounded-lg p-2.5 text-zinc-200 font-mono text-sm focus:outline-none focus:border-zinc-600 disabled:opacity-50"
          >
            <option value="SUPER_ADMIN">SUPER ADMIN</option>
            <option value="ADMIN">ADMIN</option>
            <option value="STAFF">STAFF</option>
          </select>
          {isSelf && <p className="text-[10px] text-amber-500 mt-1">* আপনি নিজের রোল পরিবর্তন করতে পারবেন না</p>}
        </div>

        {/* সেভ পরিবর্তন বাটন */}
        {isChanged && (
          <button 
            onClick={() => { setPendingAction('SAVE'); setIsModalOpen(true); }}
            className="w-full mt-2 py-2 bg-emerald-600 hover:bg-emerald-500 text-black font-semibold rounded-lg text-sm transition"
          >
            Save Changes
          </button>
        )}
      </div>

      {/* অডিট লগ লিঙ্ক */}
      <div className="bg-zinc-900/50 p-3 rounded-xl border border-zinc-800/80 mb-4 flex items-center justify-between cursor-pointer hover:bg-zinc-800/50 transition">
        <div>
          <h4 className="text-sm font-medium text-zinc-200">Activity & Audit Logs</h4>
          <p className="text-xs text-zinc-400">View all audit logs and admin changes</p>
        </div>
      </div>

      {/* রিভোক বাটন */}
      <button 
        disabled={isSelf}
        onClick={() => { setPendingAction('REVOKE'); setIsModalOpen(true); }}
        className="w-full py-3 bg-red-950/30 hover:bg-red-900/40 text-red-500 font-semibold border border-red-900/50 rounded-xl text-sm transition disabled:opacity-40"
      >
        Revoke Staff Access
      </button>

      {/* সিকিউরিটি পাসওয়ার্ড মোডাল */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl max-w-sm w-full space-y-4">
            <h3 className="text-lg font-bold text-zinc-100">
              {pendingAction === 'REVOKE' ? 'অ্যাক্সেস বাতিলের নিশ্চিতকরণ' : 'পরিবর্তন সংরক্ষণের নিশ্চিতকরণ'}
            </h3>
            <p className="text-xs text-zinc-400">
              এই সংবেদনশীল পরিবর্তনটি নিশ্চিত করতে আপনার অ্যাডমিন পাসওয়ার্ড দিন।
            </p>

            <input 
              type="password" 
              placeholder="Enter your password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black border border-zinc-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-red-500"
            />

            {error && <p className="text-xs text-red-500">{error}</p>}

            <div className="flex gap-2 pt-2">
              <button 
                onClick={() => { setIsModalOpen(false); setError(null); setPassword(''); }}
                className="w-1/2 py-2 bg-zinc-800 text-zinc-300 rounded-lg text-sm"
              >
                Cancel
              </button>
              <button 
                disabled={!password || loading}
                onClick={verifyPasswordAndExecute}
                className={`w-1/2 py-2 font-semibold rounded-lg text-sm ${
                  pendingAction === 'REVOKE' ? 'bg-red-600 text-white' : 'bg-emerald-500 text-black'
                }`}
              >
                {loading ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
