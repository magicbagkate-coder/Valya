// A color part from 0 to 1. Yellow is (1, 1, 0) and red is (1, 0, 0). The limits leave room for small differences.
const HIGH_PART = 0.9;
const LOW_PART = 0.3;
// White is the color of a row that has no mark.
const WHITE_PART = 0.95;

type RowColor = { red: number; green: number; blue: number };

/** Yellow and red rows are promo products. Rows of any other color are the main assortment. */
export function rowGroup(color: RowColor): 'promo' | 'main' {
  const strong = color.red >= HIGH_PART && color.blue <= LOW_PART;
  const yellow = strong && color.green >= HIGH_PART;
  const red = strong && color.green <= LOW_PART;
  return yellow || red ? 'promo' : 'main';
}

/** A row of the main assortment that is colored (not white) is marked as planned for the content. Promo rows are never planned. */
export function isPlanned(color: RowColor): boolean {
  const white = color.red >= WHITE_PART && color.green >= WHITE_PART && color.blue >= WHITE_PART;
  return rowGroup(color) === 'main' && !white;
}
