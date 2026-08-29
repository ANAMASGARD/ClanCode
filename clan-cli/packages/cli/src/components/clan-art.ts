import { theme } from "./theme.ts";

export type ColoredSegment = {
  text: string;
  fg: string;
};

export type ColoredLine = readonly ColoredSegment[];

export const ISLAND_WIDTH = 60;

const palette = {
  bg: theme.ink,
  bird: theme.bird,
  sun: theme.gold,
  sunCore: theme.sunCore,
  frond: theme.grass,
  frondDark: theme.grassDim,
  trunk: theme.wood,
  roof: theme.roof,
  wall: theme.woodDark,
  gold: theme.goldBright,
  grass: theme.grass,
  sand: theme.sand,
  sandDark: theme.sandDark,
  waterLight: theme.waterLight,
  water: theme.water,
  waterDeep: theme.waterDeep,
} as const;

type PaletteKey = keyof typeof palette;

/** A drawing placed at an exact column so rows stay aligned. */
type Placement = {
  col: number;
  text: string;
  key: PaletteKey;
};

function repeatPattern(pattern: string, length: number): string {
  return pattern.repeat(Math.ceil(length / pattern.length)).slice(0, length);
}

/**
 * Clan island: palms, a clan hut, beach and ocean.
 * Rows are column-addressed so the scene never drifts out of alignment.
 */
const ISLAND_ROWS: readonly (readonly Placement[])[] = [
  [
    { col: 6, text: "v", key: "bird" },
    { col: 13, text: "v", key: "bird" },
    { col: 44, text: "\\  |  /", key: "sun" },
  ],
  [
    { col: 9, text: "v", key: "bird" },
    { col: 43, text: "--", key: "sun" },
    { col: 46, text: "(", key: "sun" },
    { col: 47, text: "@", key: "sunCore" },
    { col: 48, text: ")", key: "sun" },
    { col: 50, text: "--", key: "sun" },
  ],
  [{ col: 44, text: "/  |  \\", key: "sun" }],
  [
    { col: 10, text: "__/\\__", key: "frond" },
    { col: 42, text: "__/\\__", key: "frond" },
  ],
  [
    { col: 10, text: "\\_", key: "frond" },
    { col: 12, text: "||", key: "trunk" },
    { col: 14, text: "_/", key: "frond" },
    { col: 28, text: "____", key: "roof" },
    { col: 42, text: "\\_", key: "frond" },
    { col: 44, text: "||", key: "trunk" },
    { col: 46, text: "_/", key: "frond" },
  ],
  [
    { col: 12, text: "||", key: "trunk" },
    { col: 27, text: "/", key: "roof" },
    { col: 32, text: "\\", key: "roof" },
    { col: 44, text: "||", key: "trunk" },
  ],
  [
    { col: 12, text: "||", key: "trunk" },
    { col: 26, text: "/______\\", key: "roof" },
    { col: 44, text: "||", key: "trunk" },
  ],
  [
    { col: 11, text: "/||\\", key: "trunk" },
    { col: 26, text: "|", key: "wall" },
    { col: 29, text: "[]", key: "gold" },
    { col: 33, text: "|", key: "wall" },
    { col: 43, text: "/||\\", key: "trunk" },
  ],
  [{ col: 8, text: repeatPattern(",.", 44), key: "grass" }],
  [{ col: 5, text: repeatPattern(":", 50), key: "sand" }],
  [{ col: 3, text: repeatPattern(".", 54), key: "sandDark" }],
  [{ col: 2, text: repeatPattern("~", 56), key: "waterLight" }],
  [{ col: 0, text: repeatPattern("~", ISLAND_WIDTH), key: "water" }],
  [{ col: 0, text: repeatPattern("~   ", ISLAND_WIDTH), key: "waterDeep" }],
];

function buildRow(placements: readonly Placement[]): ColoredLine {
  const ordered = [...placements].sort((left, right) => left.col - right.col);
  const segments: ColoredSegment[] = [];
  let cursor = 0;

  for (const placement of ordered) {
    if (placement.col > cursor) {
      segments.push({
        text: " ".repeat(placement.col - cursor),
        fg: palette.bg,
      });
      cursor = placement.col;
    }
    segments.push({ text: placement.text, fg: palette[placement.key] });
    cursor += placement.text.length;
  }

  if (cursor < ISLAND_WIDTH) {
    segments.push({ text: " ".repeat(ISLAND_WIDTH - cursor), fg: palette.bg });
  }
  return segments;
}

/** Pre-built island lines, every row padded to {@link ISLAND_WIDTH}. */
export const CLAN_ISLAND: readonly ColoredLine[] = ISLAND_ROWS.map(buildRow);

export function islandLineWidth(line: ColoredLine): number {
  return line.reduce((sum, segment) => sum + segment.text.length, 0);
}

export function islandRowsAreAligned(): boolean {
  return CLAN_ISLAND.every((line) => islandLineWidth(line) === ISLAND_WIDTH);
}

export function maxIslandWidth(): number {
  let max = 0;
  for (const line of CLAN_ISLAND) {
    max = Math.max(max, islandLineWidth(line));
  }
  return max;
}

export function islandUsesColor(color: string): boolean {
  return CLAN_ISLAND.some((line) =>
    line.some((segment) => segment.fg === color && segment.text.trim().length > 0),
  );
}
