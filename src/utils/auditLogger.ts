import { supabase } from '@/supabaseClient';

export interface AuditLogOptions {
  entityType: 'ambassador' | 'orders' | 'products' | 'payouts' | 'profile' | string;
  entityId?: string;       // ambassador_id, order_id, বা profile_id
  actionType: string;      // যেমন: 'PROFILE_UPDATE', 'STATUS_CHANGE'
  fieldName?: string;
  oldValue?: string | number | null;
  newValue?: string | number | null;
  reason?: string;
  changes?: Record<string, any>;
}

export const logAuditActivity = async ({
  entityType,
  entityId,
  actionType,
  fieldName,
  oldValue,
  newValue,
  reason,
  changes,
}: AuditLogOptions) => {
  try {
    // ১. বর্তমান লগইনকৃত অ্যাডমিনের আইডি বের করা
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // ২. অ্যাডমিনের ডিটেইলস নিয়ে আসা
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    // নামের নিখুঁত ফ্যালব্যাক লজিক
    let resolvedName = profile?.name || profile?.full_name || user.user_metadata?.full_name || user.user_metadata?.name;
    if (!resolvedName && user.email) {
      const emailPrefix = user.email.split('@')[0];
      resolvedName = emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
    }
    if (!resolvedName) resolvedName = 'Admin User';

    const adminRole = profile?.role || 'ADMIN';
    const adminDesignation = profile?.designation || '';
    const adminEmail = user.email || '';

    // ৩. পেলোড অবজেক্ট তৈরি
    const logPayload: Record<string, any> = {
      entity_type: entityType,
      performed_by: user.id,
      action_type: actionType,
      field_name: fieldName || null,
      old_value: oldValue !== undefined && oldValue !== null ? String(oldValue) : null,
      new_value: newValue !== undefined && newValue !== null ? String(newValue) : null,
      reason: reason || null,
      changes: changes || null,
      metadata: {
        admin_name: resolvedName,
        admin_email: adminEmail,
        admin_role: adminRole,
        admin_designation: adminDesignation,
      },
    };

    // entityType অনুযায়ী সঠিক কলাম সেট করা
    if (entityType === 'ambassador') {
      logPayload.ambassador_id = entityId;
    } else if (entityType === 'orders') {
      logPayload.order_id = entityId;
    } else if (entityType === 'profile') {
      logPayload.profile_id = entityId;
    }

    // ৪. audit_logs টেবিলে ইনসার্ট
    await supabase.from('audit_logs').insert(logPayload);
  } catch (err) {
    console.error('Failed to record audit log:', err);
  }
};
