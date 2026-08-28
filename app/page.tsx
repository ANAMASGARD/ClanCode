import { DashboardEntry } from "./components/dashboard-entry";

export default async function Home({ searchParams }: PageProps<"/">) {
  const params = await searchParams;
  const authParam = params.auth;
  const initialAuthOpen =
    authParam === "1" || (Array.isArray(authParam) && authParam.includes("1"));

  return (
    <main className="flex min-h-full flex-1 items-center justify-center">
      <DashboardEntry initialAuthOpen={initialAuthOpen} />
    </main>
  );
}
