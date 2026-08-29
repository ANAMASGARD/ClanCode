import { useTerminalDimensions } from "@opentui/react";
import { ClanBanner } from "./clan-banner.tsx";
import {
  PACKAGE_VERSION,
  pickTitleFont,
  shouldShowIsland,
  statusColor,
  controlPlaneColor,
  controlPlaneLabel,
  theme,
  truncateMiddle,
  type ControlPlaneState,
} from "./theme.ts";

export type HeaderProps = {
  repository: string;
  branch?: string;
  mode: string;
  model: string;
  runtime: string;
  status: string;
  connection?: ControlPlaneState;
};

function StatusChip(props: { label: string; value: string; valueColor?: string }) {
  return (
    <text>
      <span fg={theme.mutedDark}>{props.label}=</span>
      <span fg={props.valueColor ?? theme.white}>{props.value}</span>
    </text>
  );
}

function StatusSeparator() {
  return <text fg={theme.mutedDark}> · </text>;
}

function ConnectionChip(props: { state: ControlPlaneState }) {
  const color = controlPlaneColor(props.state);
  return (
    <text>
      <span fg={color}>● </span>
      <span fg={theme.mutedDark}>control=</span>
      <span fg={color}>{controlPlaneLabel(props.state)}</span>
    </text>
  );
}

export function Header(props: HeaderProps) {
  const { width, height } = useTerminalDimensions();
  const titleFont = pickTitleFont(width);
  const showIsland = shouldShowIsland(height);
  const repoLabel = truncateMiddle(props.repository, 28);
  const branchLabel = truncateMiddle(props.branch ?? "?", 18);
  const modelLabel = truncateMiddle(props.model, 16);
  const runtimeLabel = truncateMiddle(props.runtime, 12);
  const statusFg = statusColor(props.status);
  const connection = props.connection ?? "offline";

  return (
    <box
      flexDirection="column"
      alignItems="center"
      width="100%"
      paddingTop={1}
      paddingBottom={1}
      gap={1}
    >
      <ascii-font font={titleFont} text="CLANCODE" color={theme.gold} />
      <text fg={theme.muted}>
        <span fg={theme.mutedDark}>@clancode/cli</span> v{PACKAGE_VERSION}
      </text>
      <box flexDirection="row" flexWrap="wrap" justifyContent="center" alignItems="center">
        <StatusChip label="repo" value={repoLabel} />
        <StatusSeparator />
        <StatusChip label="branch" value={branchLabel} valueColor={theme.sky} />
        <StatusSeparator />
        <StatusChip label="mode" value={props.mode} valueColor={theme.gold} />
        <StatusSeparator />
        <StatusChip label="model" value={modelLabel} />
        <StatusSeparator />
        <StatusChip label="trueforge" value={runtimeLabel} valueColor={theme.elixir} />
        <StatusSeparator />
        <StatusChip label="agent" value={props.status} valueColor={statusFg} />
        <StatusSeparator />
        <ConnectionChip state={connection} />
      </box>
      {showIsland ? <ClanBanner /> : null}
    </box>
  );
}
