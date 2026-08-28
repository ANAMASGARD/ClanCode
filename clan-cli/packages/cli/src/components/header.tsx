export type HeaderProps = {
  repository: string;
  branch?: string;
  mode: string;
  model: string;
  runtime: string;
  status: string;
};

export function Header(props: HeaderProps) {
  const line = `CLAN CODE  repo=${props.repository}  branch=${props.branch ?? "?"}  mode=${props.mode}  model=${props.model}  trueforge=${props.runtime}  status=${props.status}`;
  return (
    <box flexDirection="column" justifyContent="center" alignItems="flex-start" paddingLeft={1}>
      <box flexDirection="row" gap={2} alignItems="center">
        <ascii-font font="tiny" text="Clan" color="#FFD54A" />
        <ascii-font font="tiny" text="Code" />
      </box>
      <text fg="#90A4AE">{line}</text>
    </box>
  );
}
