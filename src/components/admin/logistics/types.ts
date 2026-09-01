export interface OrderItemDetail {
  id: string;
  product_id?: string | null;
  product_name: string;
  quantity: number;
  size?: string | null;
  color?: string | null;
}

export interface OrderItem {
  id: string;
  user_id?: string | null;
  courier_name?: string | null;
  return_reason?: string | null;
  return_status?: string | null;
  status?: string | null;
  created_at: string;
  order_items?: OrderItemDetail[];
}

export interface StoreSettings {
  id: number;
  delivery_charge: number;
  vat_rate: number;
}
