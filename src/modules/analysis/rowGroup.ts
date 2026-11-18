// A color part from 0 to 1. Yellow is (1, 1, 0) and red is (1, 0, 0). The limits leave room for small differences.
const HIGH_PART = 0.9;
const LOW_PART = 0.3;

type RowColor = { red: number; green: number; blue: number };

/** Yellow and red rows are promo products. Rows of any other color are the main assortment. */
export function rowGroup(color: RowColor): 'promo' | 'main' {
  const strong = color.red >= HIGH_PART && color.blue <= LOW_PART;
  const yellow = strong && color.green >= HIGH_PART;
  const red = strong && color.green <= LOW_PART;
  return yellow || red ? 'promo' : 'main';
}
