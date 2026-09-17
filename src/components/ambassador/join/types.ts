export interface AmbassadorJoinProps {
  initialInviteData: any;
}

export interface ChatMessage {
  id?: string;
  sender_role: string;
  message: string;
  sender_email?: string;
  recipient_email?: string;
  channel_id?: string;
  created_at?: string;
}
