import { auth } from "@clerk/nextjs/server";
import { Show, UserButton } from "@clerk/nextjs";
import type { ReactNode } from "react";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  await auth.protect({ unauthenticatedUrl: "/?auth=1" });

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="flex items-center justify-end p-4">
        <Show when="signed-in">
          <UserButton />
        </Show>
      </header>
      {children}
    </div>
  );
}
