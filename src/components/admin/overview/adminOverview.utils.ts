export const formatNumber = (num: number): string => {
  if (typeof num !== 'number' || isNaN(num)) return '0';
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return num.toLocaleString();
};

export const formatDateToInput = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatDateForUI = (dateStr: string, dateFormat: string = 'DD/MM/YYYY'): string => {
  if (!dateStr) return 'DD / MM / YYYY';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const [year, month, day] = parts;
  if (dateFormat === 'DD/MM/YYYY') {
    return `${day} / ${month} / ${year}`;
  }
  return `${month} / ${day} / ${year}`;
};

export const formatDisplayDate = (dateStr: string, dateFormat: string = 'DD/MM/YYYY'): string => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 1) return parts[0];
  if (parts.length === 2) {
    if (parts[1].startsWith('W')) {
      return `${parts[0]} ${parts[1]}`;
    }
    const date = new Date(Number(parts[0]), Number(parts[1]) - 1, 1);
    return date.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' }).toUpperCase();
  }
  const [year, month, day] = parts.map(Number);
  const d = String(day).padStart(2, '0');
  const m = String(month).padStart(2, '0');
  if (dateFormat === 'DD/MM/YYYY') {
    return `${d}/${m}/${year}`;
  }
  return `${m}/${d}/${year}`;
};

export const getSmoothPath = (pts: { x: number; y: number }[]): string => {
  if (pts.length === 0) return '';
  if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;

  let path = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i === 0 ? i : i - 1];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2 < pts.length ? i + 2 : i + 1];

    const cp1x = p1.x + (p2.x - p0.x) * 0.15;
    const cp1y = p1.y + (p2.y - p0.y) * 0.15;
    const cp2x = p2.x - (p3.x - p1.x) * 0.15;
    const cp2y = p2.y - (p3.y - p1.y) * 0.15;

    path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  return path;
};
