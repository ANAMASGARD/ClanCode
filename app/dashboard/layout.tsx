import { Show, UserButton } from "@clerk/nextjs";
import type { ReactNode } from "react";

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
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
