import { Header } from "../components/header";
import { theme } from "../components/theme";

export function Shell() {
  return (
    <box
      alignItems="center"
      justifyContent="center"
      backgroundColor={theme.ink}
      width="100%"
      height="100%"
    >
      <Header
        repository="unresolved"
        mode="PLAN"
        model="unselected"
        runtime="idle"
        status="idle"
      />
    </box>
  );
}
