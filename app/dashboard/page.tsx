import { DevicePanel } from "./device-panel";

export default async function DashboardPage() {
  return (
    <main className="flex flex-1 flex-col p-6">
      <DevicePanel />
    </main>
  );
}
