export type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  images: string[];
  sizes?: string[];
  colors?: string[];
  inStock: boolean;
  material?: string;
};