import { createClient } from "@/data/supabase/server";

import { signOut } from "../actions";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-6 py-16 text-white">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/40">
            FairSplit AI
          </p>
          <h1 className="mt-2 text-3xl font-semibold">Dashboard</h1>
          <p className="mt-2 text-sm text-white/60">
            Signed in as {user?.email}
          </p>
        </div>
        <form action={signOut}>
          <button
            className="rounded-2xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold"
            type="submit"
          >
            Sign out
          </button>
        </form>
      </header>

      <section className="rounded-3xl border border-white/10 bg-white/5 p-8 text-white/70">
        <div className="flex flex-col gap-3">
          <p className="text-sm text-white/60">
            Start a new estate or continue an existing collaboration.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              className="w-fit rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-zinc-900"
              href="/setup"
            >
              Start setup
            </a>
            <a
              className="w-fit rounded-2xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold"
              href="/estates"
            >
              View estates
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
