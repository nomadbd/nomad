export interface AmbassadorInvite {
  id?: string;
  token: string;
  recipient_identifier: string;
  initial_admin_message?: string;
  expires_at: string;
  is_registered: boolean;
  reissue_requested?: boolean;
  created_at?: string;
}

export interface SendInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}
