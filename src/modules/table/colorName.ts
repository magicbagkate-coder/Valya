type ColorParts = { red: number; green: number; blue: number };
type NamedColor = { name: string; red: number; green: number; blue: number };

// The colors that the team uses in the table, with the names that the AI gets in the files.
const NAMED_COLORS: NamedColor[] = [
  { name: 'white', red: 1, green: 1, blue: 1 },
  { name: 'yellow', red: 1, green: 1, blue: 0 },
  { name: 'red', red: 1, green: 0, blue: 0 },
  { name: 'green', red: 0, green: 1, blue: 0 },
  { name: 'blue', red: 0, green: 0, blue: 1 },
  { name: 'purple', red: 0.6, green: 0, blue: 1 },
  { name: 'orange', red: 1, green: 0.6, blue: 0 },
  { name: 'light-blue', red: 0.27, green: 0.74, blue: 0.78 },
  { name: 'peach', red: 0.98, green: 0.8, blue: 0.61 },
];

// How far a color may be from a named color and still get its name.
const MAX_DISTANCE = 0.2;

const distanceOf = (first: ColorParts, second: ColorParts): number =>
  Math.hypot(first.red - second.red, first.green - second.green, first.blue - second.blue);

const hexPart = (value: number): string =>
  Math.round(Math.min(1, Math.max(0, value)) * 255)
    .toString(16)
    .padStart(2, '0');

/** Gives the name of a color, for example "yellow" or "purple". A color that is not close to any known one is written as "#rrggbb". */
export function colorName(color: ColorParts): string {
  const nearest = [...NAMED_COLORS].sort((first, second) => distanceOf(first, color) - distanceOf(second, color))[0];
  if (nearest && distanceOf(nearest, color) <= MAX_DISTANCE) return nearest.name;
  return `#${hexPart(color.red)}${hexPart(color.green)}${hexPart(color.blue)}`;
}
