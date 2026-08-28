import { Header } from "../components/header";

export function Shell() {
  return (
    <box
      alignItems="center"
      justifyContent="center"
      backgroundColor="#0D0D12"
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
