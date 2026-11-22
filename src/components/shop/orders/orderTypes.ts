export interface OrderItem {
  product_name: string;
  product_image: string;
  size: string;
  color: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  created_at: string;
  total_amount: number;
  status: string;
  items: OrderItem[];
  customer_name?: string;
  customer_phone?: string;
  shipping_address?: string;
  delivery_charge?: number;
  vat_amount?: number;
}

export interface OrderHistoryProps {
  userId?: string | null;
}
