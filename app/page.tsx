import { DashboardEntry } from "./components/dashboard-entry";
import { SiteHeader } from "./components/site-header";

export default async function Home({ searchParams }: PageProps<"/">) {
  const params = await searchParams;
  const authParam = params.auth;
  const initialAuthOpen =
    authParam === "1" || (Array.isArray(authParam) && authParam.includes("1"));

  return (
    <>
      <SiteHeader />
      <main className="flex min-h-[calc(100%-4rem)] flex-1 items-center justify-center">
        <DashboardEntry initialAuthOpen={initialAuthOpen} />
      </main>
    </>
  );
}
