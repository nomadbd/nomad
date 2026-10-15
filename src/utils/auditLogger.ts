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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // profiles টেবিল থেকে সরাসরি name, designation, role ফেস করা
    const { data: profile } = await supabase
      .from('profiles')
      .select('name, role, designation, email')
      .eq('id', user.id)
      .single();

    const adminName = profile?.name || 'Admin User';
    const adminRole = profile?.role || 'SUPER_ADMIN';
    const adminDesignation = profile?.designation || '';
    const adminEmail = profile?.email || user.email || '';

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
        admin_name: adminName,
        admin_email: adminEmail,
        admin_role: adminRole,
        admin_designation: adminDesignation,
      },
    };

    if (entityType === 'ambassador') {
      logPayload.ambassador_id = entityId;
    } else if (entityType === 'orders') {
      logPayload.order_id = entityId;
    } else if (entityType === 'profile') {
      logPayload.profile_id = entityId;
    }

    await supabase.from('audit_logs').insert(logPayload);
  } catch (err) {
    console.error('Failed to record audit log:', err);
  }
};
