export interface Reminder {
  id: string;
  content: string;
  reference: string;
  category: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
  profiles?: {
    name: string;
    designation: string;
    avatar_url?: string | null;
  };
}

export interface AdminRemindersProps {
  searchQuery?: string;
  isAddOpen?: boolean;
  onCloseAdd?: () => void;
}
