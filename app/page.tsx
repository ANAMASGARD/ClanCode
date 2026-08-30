import { LandingHero } from "./components/landing-hero";

export default async function Home({ searchParams }: PageProps<"/">) {
  const params = await searchParams;
  const authParam = params.auth;
  const initialAuthOpen =
    authParam === "1" || (Array.isArray(authParam) && authParam.includes("1"));

  return (
    <main className="landing-page">
      <LandingHero initialAuthOpen={initialAuthOpen} />
    </main>
  );
}
