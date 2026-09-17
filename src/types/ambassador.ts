export interface AmbassadorInviteData {
  token?: string;
  display_name?: string;
  recipient_identifier?: string;
  email?: string;
  commission_rate?: number;
  discount_percent?: number;
  expires_at?: string;
  is_registered?: boolean;
  reissue_requested?: boolean;
}

export interface AmbassadorJoinProps {
  initialInviteData: AmbassadorInviteData;
}

export interface CommunicationMessage {
  id?: string;
  sender_role: string;
  sender_email?: string;
  recipient_email?: string;
  channel_id?: string;
  message: string;
  created_at?: string;
}
