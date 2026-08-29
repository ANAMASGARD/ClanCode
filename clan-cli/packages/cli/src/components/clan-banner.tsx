import { CLAN_ISLAND } from "./clan-art.ts";
import { theme } from "./theme.ts";

export function ClanBanner() {
  return (
    <box flexDirection="column" alignItems="center" width="100%">
      {CLAN_ISLAND.map((line, lineIndex) => (
        <text key={`island-${String(lineIndex)}`}>
          {line.map((segment, segmentIndex) => (
            <span
              key={`island-${String(lineIndex)}-${String(segmentIndex)}`}
              fg={segment.fg}
            >
              {segment.text}
            </span>
          ))}
        </text>
      ))}
      <text fg={theme.mutedDark}>
        <span fg={theme.gold}>TIP:</span> shift+tab modes · /help commands · ctrl+c cancel
      </text>
    </box>
  );
}
