import React from 'react';

export interface Products {
  id: string | number;
  name: string;
  description: string;
  price: number;
  category: string;
  stock_quantity: number;
  status: 'active' | 'sold_out' | 'archived' | 'hidden' | string;
  sizes: string[];
  colors: string[];
  created_at: string;
  product_media: { media_url: string; media_type: string; sort_order?: number }[];
  details?: Record<string, string> | null;
  image_url?: string;
}

export interface AdminProductsProps {
  showAddModal?: boolean;
  setShowAddModal?: React.Dispatch<React.SetStateAction<boolean>> | ((value: boolean) => void);
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  isFilterOpen?: boolean;
  isSearchOpen?: boolean;
  dateFormat?: string;
  isAddOpen?: boolean;
  onToggleAdd?: () => void;
  onCloseAdd?: () => void;
}