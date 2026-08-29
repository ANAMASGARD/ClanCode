import { auth } from "@clerk/nextjs/server";
import type { ReactNode } from "react";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  await auth.protect({ unauthenticatedUrl: "/?auth=1" });

  return (
    <div className="flex min-h-full flex-1 flex-col">
      {children}
    </div>
  );
}
