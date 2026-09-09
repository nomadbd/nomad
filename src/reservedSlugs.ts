export const RESERVED_SLUGS = [
  'admin',
  'administrator',
  'api',
  'checkout',
  'cart',
  'login',
  'signup',
  'register',
  'auth',
  'dashboard',
  'settings',
  'profile',
  'ambassador',
  'products',
  'product',
  'orders',
  'about',
  'contact',
  'terms',
  'privacy',
  'help',
  'support',
  'shop',
  'store'
];

export const isReservedSlug = (slug: string): boolean => {
  if (!slug) return false;
  return RESERVED_SLUGS.includes(slug.trim().toLowerCase());
};
