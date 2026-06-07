import { useState } from 'react';

export const useSearchLogic = (products) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProducts = searchQuery.trim() === '' ? [] : products.filter(p => 
    p.name.toLowerCase().replace(/-/g, ' ').includes(searchQuery.toLowerCase().replace(/-/g, ' '))
  );

  return { searchQuery, setSearchQuery, filteredProducts };
};
