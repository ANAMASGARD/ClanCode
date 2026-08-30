/** Clan Code TUI palette — yellow-forward, CoC-inspired accents. */
export const theme = {
  ink: "#0D0D12",
  gold: "#FFD54A",
  goldDim: "#C9A227",
  grass: "#66BB6A",
  grassDim: "#4E8F52",
  stone: "#78909C",
  stoneDark: "#546E7A",
  wood: "#A1887F",
  woodDark: "#6D4C41",
  elixir: "#BA68C8",
  sky: "#80D8FF",
  white: "#FFFFFF",
  muted: "#90A4AE",
  mutedDark: "#607D8B",
  success: "#66BB6A",
  warning: "#FFD54A",
  danger: "#FF8A80",
  border: "#FFD54A",
  borderDim: "#546E7A",
  /** Island scene palette */
  goldBright: "#FFEB3B",
  sunCore: "#FFF176",
  bird: "#CFD8DC",
  roof: "#E07B39",
  sand: "#F5D76E",
  sandDark: "#C9A227",
  waterLight: "#4FC3F7",
  water: "#039BE5",
  waterDeep: "#0277BD",
} as const;

export const PACKAGE_VERSION = "0.1.0-beta.2";

export type AsciiFontChoice = "block" | "tiny";

export function pickTitleFont(width: number): AsciiFontChoice {
  return width >= 72 ? "block" : "tiny";
}

export function shouldShowIsland(height: number): boolean {
  return height >= 30;
}

export type ControlPlaneState = "offline" | "connecting" | "connected" | "error";

export function controlPlaneColor(state: ControlPlaneState): string {
  switch (state) {
    case "connected":
      return theme.success;
    case "connecting":
      return theme.warning;
    case "error":
      return theme.danger;
    case "offline":
      return theme.muted;
    default: {
      const _never: never = state;
      return _never;
    }
  }
}

export function controlPlaneLabel(state: ControlPlaneState): string {
  switch (state) {
    case "connected":
      return "connected";
    case "connecting":
      return "connecting";
    case "error":
      return "offline";
    case "offline":
      return "offline";
    default: {
      const _never: never = state;
      return _never;
    }
  }
}

export function statusColor(status: string): string {
  switch (status) {
    case "idle":
    case "ready":
      return theme.success;
    case "streaming":
    case "creating_session":
      return theme.warning;
    case "awaiting_approval":
      return theme.danger;
    case "failed":
    case "cancelled":
      return theme.danger;
    default:
      return theme.muted;
  }
}

export function truncateMiddle(value: string, max: number): string {
  if (value.length <= max) {
    return value;
  }
  if (max <= 3) {
    return value.slice(0, max);
  }
  const head = Math.ceil((max - 1) / 2);
  const tail = Math.floor((max - 1) / 2);
  return `${value.slice(0, head)}…${value.slice(value.length - tail)}`;
}
