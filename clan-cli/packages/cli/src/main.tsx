import { createCliRenderer } from "@opentui/core";
import { createRoot } from "@opentui/react/renderer";
import { Shell } from "./app/shell";

const renderer = await createCliRenderer({ exitOnCtrlC: true });
createRoot(renderer).render(<Shell />);
