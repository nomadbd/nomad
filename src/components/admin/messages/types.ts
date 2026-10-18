export interface ReadByStatus {
  user_email: string;
  user_name?: string;
  seen_at?: string;
}

export interface Message {
  id: string;
  sender: 'USER' | 'ADMIN';
  senderEmail?: string;
  senderName?: string;
  senderDesignation?: string;
  text: string;
  timestamp: string;
  read_by?: ReadByStatus[];
}

export interface Thread {
  id: string;
  userName: string;
  userEmail: string;
  userPhone?: string;
  role: string;
  designation?: string;
  avatarUrl?: string;
  createdAt?: string;      // profiles টেবিলের created_at
  inviteSentAt?: string;   // ambassadors টেবিলের invite_sent_at
  unreadCount: number;
  lastMessage: string;
  lastMessageTime: string;
  messages: Message[];
}

export interface AdminMessagesProps {
  searchQuery?: string;
  isFilterOpen?: boolean;
  isSearchOpen?: boolean;
  activeThreadId?: string | null;
  onSelectThread?: (id: string | null, thread?: Thread | null) => void;
  onNavigateToTab?: (tabName: 'customers' | 'ambassadors' | 'staff', userId?: string) => void;
}
