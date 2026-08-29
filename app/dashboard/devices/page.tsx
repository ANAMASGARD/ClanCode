import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { DevicePanel } from "../device-panel";

export default function DevicesPage() {
  return (
    <>
      <header className="flex items-center justify-between gap-4 p-4 sm:px-6">
        <Link href="/dashboard" className="rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-emerald-950 shadow-[0_8px_24px_rgba(16,185,129,0.25)] transition hover:bg-emerald-400">
          Enter Clan
        </Link>
        <UserButton />
      </header>
      <main className="flex flex-1 flex-col p-6">
        <DevicePanel />
      </main>
    </>
  );
}
