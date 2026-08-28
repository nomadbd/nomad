export interface SupabaseProductMedia {
  media_url: string;
}

export interface SupabaseProduct {
  name: string;
  product_media: SupabaseProductMedia[];
}

export interface SupabaseOrderItem {
  quantity: number;
  size: string;
  color: string;
  price_at_purchase: number;
  product_name?: string;
  product_image?: string;
  products?: SupabaseProduct;
}

export interface SupabaseOrderResponse {
  id: string;
  created_at: string;
  total_amount: number;
  status: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  shipping_address?: string;
  delivery_charge?: number;
  vat_amount?: number;
  payment_status?: string;
  courier_name?: string;
  tracking_id?: string;
  admin_notes?: string;
  customer_notes?: string;
  return_reason?: string;
  order_items: SupabaseOrderItem[];
}

export interface AdminOrdersProps {
  isSearchOpen?: boolean;
  isFilterOpen?: boolean;
  onToggleSearch?: () => void;
  onToggleFilter?: () => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}