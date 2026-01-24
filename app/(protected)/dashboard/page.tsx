import { createClient } from "@/data/supabase/server";

import { signOut } from "../actions";

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-6 py-12">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            FairSplit AI
          </p>
          <h1 className="mt-2 text-3xl font-semibold">Dashboard</h1>
          <p className="mt-2 text-sm text-zinc-500">
            Signed in as {user?.email}
          </p>
        </div>
        <form action={signOut}>
          <button
            className="rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800"
            type="submit"
          >
            Sign out
          </button>
        </form>
      </header>

      <section className="rounded-3xl border border-dashed border-zinc-300 bg-white p-8 text-zinc-500">
        <div className="flex flex-col gap-3">
          <p className="text-sm text-zinc-500">
            Estate management lives in the Estates workspace.
          </p>
          <a
            className="w-fit rounded-2xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white"
            href="/estates"
          >
            Go to estates
          </a>
        </div>
      </section>
    </div>
  );
}
