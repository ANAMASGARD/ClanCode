import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";

const buttonClassName =
  "rounded-full border border-black/[.08] px-4 py-2 text-sm font-medium transition-colors hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a]";

export function SiteHeader() {
  return (
    <header className="flex h-16 items-center justify-end gap-3 p-4">
      <Show when="signed-out">
        <SignInButton>
          <button type="button" className={buttonClassName}>
            Sign in
          </button>
        </SignInButton>
        <SignUpButton>
          <button type="button" className={buttonClassName}>
            Sign up
          </button>
        </SignUpButton>
      </Show>
      <Show when="signed-in">
        <UserButton />
      </Show>
    </header>
  );
}
