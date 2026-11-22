import { SearchProduct } from './searchTypes';

const BENGALI_TO_ENGLISH_ALIASES: Record<string, string[]> = {
  'টি-শার্ট': ['t-shirt', 'tshirt', 'tee'],
  'টিশার্ট': ['t-shirt', 'tshirt', 'tee'],
  'শার্ট': ['shirt'],
  'প্যান্ট': ['pant', 'pants', 'trouser', 'trousers'],
  'জিন্স': ['jeans', 'denim'],
  'হুডি': ['hoodie'],
  'জ্যাকেট': ['jacket'],
  'পোলো': ['polo'],
  'কালো': ['black'],
  'সাদা': ['white'],
  'নীল': ['blue', 'navy'],
  'লাল': ['red'],
  'সবুজ': ['green', 'olive'],
  'ধূসর': ['grey', 'gray'],
};

const normalizeText = (text: string): string =>
  text
    .toLowerCase()
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const expandQueryTokens = (rawQuery: string): string[] => {
  const normalized = normalizeText(rawQuery);
  if (!normalized) return [];

  const tokens = normalized.split(' ').filter(Boolean);
  const expanded = new Set<string>([normalized, ...tokens]);

  Object.entries(BENGALI_TO_ENGLISH_ALIASES).forEach(([bn, enList]) => {
    if (normalized.includes(bn)) {
      enList.forEach((en) => expanded.add(normalizeText(en)));
    }
  });

  tokens.forEach((token) => {
    if (token === 'tshirt') {
      expanded.add('t shirt');
      expanded.add('t-shirt');
    }
    if (token === 't-shirt' || token === 't') {
      expanded.add('tshirt');
    }
  });

  return Array.from(expanded);
};

export const scoreSearchProduct = (product: SearchProduct, rawQuery: string): number => {
  const query = normalizeText(rawQuery);
  if (!query) return 0;

  let score = 0;

  const name = normalizeText(product.name || '');
  const category = normalizeText(product.category || '');
  const description = normalizeText(product.description || '');
  const sizes = (product.sizes || []).map((s) => normalizeText(String(s)));
  const colors = (product.colors || []).map((c) => normalizeText(String(c)));
  const detailsText = product.details
    ? normalizeText(
        Object.entries(product.details)
          .map(([k, v]) => `${k} ${v}`)
          .join(' ')
      )
    : '';

  const expandedTerms = expandQueryTokens(rawQuery);
  const queryTokens = query.split(' ').filter(Boolean);

  if (name === query) {
    score += 140;
  } else if (name.startsWith(query)) {
    score += 110;
  } else if (name.includes(query)) {
    score += 85;
  }

  expandedTerms.forEach((term) => {
    if (!term) return;
    if (category === term) {
      score += 95;
    } else if (category.startsWith(term)) {
      score += 75;
    } else if (category.includes(term)) {
      score += 60;
    }
  });

  let matchedNameTokens = 0;
  queryTokens.forEach((token) => {
    const tokenAliases = expandQueryTokens(token);
    const inName = tokenAliases.some((alias) => name.includes(alias));
    const inCategory = tokenAliases.some((alias) => category.includes(alias));

    if (inName) {
      matchedNameTokens += 1;
      score += name.split(' ').some((w) => w.startsWith(token)) ? 32 : 22;
    }
    if (inCategory) {
      score += 24;
    }
  });

  if (queryTokens.length > 1 && matchedNameTokens === queryTokens.length) {
    score += 40;
  }

  queryTokens.forEach((token) => {
    const tokenAliases = expandQueryTokens(token);

    if (sizes.some((s) => s === token)) {
      score += 75;
    } else if (sizes.some((s) => s.includes(token) && token.length >= 2)) {
      score += 40;
    }

    if (colors.some((c) => tokenAliases.includes(c))) {
      score += 70;
    } else if (
      colors.some((c) =>
        tokenAliases.some(
          (alias) => alias.length >= 3 && c.includes(alias)
        )
      )
    ) {
      score += 45;
    }
  });

  const numericMatches = rawQuery
    .replace(/,/g, '')
    .match(/\d+(\.\d+)?/g);

  if (numericMatches && numericMatches.length > 0) {
    const targetPrice = parseFloat(numericMatches[0]);
    if (!Number.isNaN(targetPrice) && targetPrice > 0) {
      const diff = Math.abs(product.price - targetPrice);
      if (diff === 0) {
        score += 85;
      } else if (diff <= targetPrice * 0.1) {
        score += 50;
      } else if (diff <= targetPrice * 0.25) {
        score += 25;
      } else if (
        String(product.price).startsWith(
          String(Math.floor(targetPrice))
        )
      ) {
        score += 30;
      }
    }
  }

  if (description.includes(query)) {
    score += 25;
  } else {
    queryTokens.forEach((token) => {
      if (token.length >= 2 && description.includes(token)) {
        score += 10;
      }
    });
  }

  if (detailsText && detailsText.includes(query)) {
    score += 20;
  }

  if (
    score > 0 &&
    product.status === 'active' &&
    product.stock_quantity > 0
  ) {
    score += 5;
  }

  return score;
};
