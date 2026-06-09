import fs from 'fs';
import path from 'path';
import { Product } from '@/types/product';

const productsDir = path.join(process.cwd(), 'data/products');

export function getAllProducts(): Product[] {
  if (!fs.existsSync(productsDir)) return [];
  
  const files = fs.readdirSync(productsDir).filter(file => file.endsWith('.json'));
  
  return files.map(file => {
    const content = fs.readFileSync(path.join(productsDir, file), 'utf-8');
    return JSON.parse(content) as Product;
  });
}

export function getProductsByCategory(category: string, limit = 10): Product[] {
  const all = getAllProducts();
  let filtered = all.filter(p => 
    p.category.toLowerCase() === category.toLowerCase()
  );
  
  // Random shuffle
  filtered = filtered.sort(() => Math.random() - 0.5);
  return filtered.slice(0, limit);
}

export function getProductById(id: string): Product | undefined {
  return getAllProducts().find(p => p.id === id);
}

export function searchProducts(query: string): Product[] {
  const all = getAllProducts();
  const q = query.toLowerCase();
  return all.filter(p => 
    p.name.toLowerCase().includes(q) || 
    p.description.toLowerCase().includes(q)
  );
}