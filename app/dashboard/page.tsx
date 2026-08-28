import { auth } from "@clerk/nextjs/server";

export default async function DashboardPage() {
  await auth.protect({ unauthenticatedUrl: "/?auth=1" });

  return (
    <main className="flex flex-1 items-center justify-center">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">Coming soon</p>
    </main>
  );
}
