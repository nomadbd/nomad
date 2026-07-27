// ১. সিস্টেমে বিদ্যমান ইউজার রোলসমূহ
export type UserRole = 'ADMIN' | 'MANAGER' | 'FINANCE';

// ২. গ্রানুলার বা সুনির্দিষ্ট পারমিশন স্ট্রাকচার
export interface UserPermissions {
  orders: boolean;
  products: boolean;
  finance: boolean;
  settings: boolean;
}

// ৩. Supabase 'profiles' টেবিলের সম্পূর্ণ ডাটা টাইপ
export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  permissions: UserPermissions;
  hired_at: string;
  role_assigned_at: string;
  created_at: string;
  updated_at?: string | null;
}
