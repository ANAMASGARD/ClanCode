import { auth } from "@clerk/nextjs/server";

import { DevicePanel } from "./device-panel";

export default async function DashboardPage() {
  await auth.protect({ unauthenticatedUrl: "/?auth=1" });

  return (
    <main className="flex flex-1 flex-col p-6">
      <DevicePanel />
    </main>
  );
}
