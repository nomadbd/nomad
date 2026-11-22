export interface Product {
  id: string | number;
  name: string;
  description: string;
  price: number;
  category: string;
  stock_quantity: number;
  status: 'active' | 'sold_out' | string;
  sizes: string[];
  colors: string[];
  created_at: string;
  product_media: { media_url: string; media_type: string }[];
  details?: Record<string, string> | null;
}
