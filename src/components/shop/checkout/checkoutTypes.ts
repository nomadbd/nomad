export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  size?: string;
  color?: string;
  image_url?: string;
}

export interface CountryInfo {
  name: string;
  code: string;
  flag: string;
  minDigits: number;
  maxDigits: number;
  bdMobileCheck?: boolean;
}

export const ALL_COUNTRIES: CountryInfo[] = [
  { name: 'Bangladesh', code: '+880', flag: '🇧🇩', minDigits: 10, maxDigits: 10, bdMobileCheck: true },
  { name: 'United States', code: '+1', flag: '🇺🇸', minDigits: 10, maxDigits: 10 },
  { name: 'United Kingdom', code: '+44', flag: '🇬🇧', minDigits: 10, maxDigits: 11 },
  { name: 'United Arab Emirates', code: '+971', flag: '🇦🇪', minDigits: 9, maxDigits: 9 },
  { name: 'Saudi Arabia', code: '+966', flag: '🇸🇦', minDigits: 9, maxDigits: 9 },
  { name: 'Canada', code: '+1', flag: '🇨🇦', minDigits: 10, maxDigits: 10 },
  { name: 'Australia', code: '+61', flag: '🇦🇺', minDigits: 9, maxDigits: 9 },
  { name: 'India', code: '+91', flag: '🇮🇳', minDigits: 10, maxDigits: 10 },
  { name: 'Malaysia', code: '+60', flag: '🇲🇾', minDigits: 9, maxDigits: 10 },
  { name: 'Singapore', code: '+65', flag: '🇸🇬', minDigits: 8, maxDigits: 8 },
  { name: 'Germany', code: '+49', flag: '🇩🇪', minDigits: 10, maxDigits: 11 },
  { name: 'France', code: '+33', flag: '🇫🇷', minDigits: 9, maxDigits: 9 },
  { name: 'Italy', code: '+39', flag: '🇮🇹', minDigits: 9, maxDigits: 10 },
  { name: 'Japan', code: '+81', flag: '🇯🇵', minDigits: 10, maxDigits: 10 },
  { name: 'South Korea', code: '+82', flag: '🇰🇷', minDigits: 9, maxDigits: 10 },
  { name: 'Qatar', code: '+974', flag: '🇶🇦', minDigits: 8, maxDigits: 8 },
  { name: 'Kuwait', code: '+965', flag: '🇰🇼', minDigits: 8, maxDigits: 8 },
  { name: 'Oman', code: '+968', flag: '🇴🇲', minDigits: 8, maxDigits: 8 },
  { name: 'Bahrain', code: '+973', flag: '🇧🇭', minDigits: 8, maxDigits: 8 },
  { name: 'Turkey', code: '+90', flag: '🇹🇷', minDigits: 10, maxDigits: 10 },
  { name: 'Pakistan', code: '+92', flag: '🇵🇰', minDigits: 10, maxDigits: 10 },
  { name: 'Netherlands', code: '+31', flag: '🇳🇱', minDigits: 9, maxDigits: 9 },
  { name: 'Spain', code: '+34', flag: '🇪🇸', minDigits: 9, maxDigits: 9 },
  { name: 'Switzerland', code: '+41', flag: '🇨🇭', minDigits: 9, maxDigits: 9 },
  { name: 'Sweden', code: '+46', flag: '🇸🇪', minDigits: 9, maxDigits: 9 },
  { name: 'China', code: '+86', flag: '🇨🇳', minDigits: 11, maxDigits: 11 },
  { name: 'South Africa', code: '+27', flag: '🇿🇦', minDigits: 9, maxDigits: 9 },
];
