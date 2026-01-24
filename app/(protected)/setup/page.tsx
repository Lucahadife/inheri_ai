import { createClient } from "@/data/supabase/server";

import { createEstateFromSetup } from "./actions";

type SetupPageProps = {
  searchParams?:
    | { error?: string; role?: string }
    | Promise<{ error?: string; role?: string }>;
};

export default async function SetupPage({ searchParams }: SetupPageProps) {
  const resolvedSearchParams = await Promise.resolve(searchParams);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-10 px-6 py-16">
      <header className="flex flex-col gap-3">
        <p className="text-xs uppercase tracking-[0.3em] text-white/40">
          Setup
        </p>
        <h1 className="text-3xl font-semibold text-white">
          Start your estate workspace
        </h1>
        <p className="text-sm text-white/60">
          {resolvedSearchParams?.role === "heir"
            ? "Heirs can organize the estate together and align on rules before allocation."
            : "Executors can set the estate foundation and invite heirs to collaborate."}
        </p>
      </header>

      {resolvedSearchParams?.error ? (
        <div className="rounded-2xl border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {resolvedSearchParams.error}
        </div>
      ) : null}

      <section className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-lg shadow-black/40">
        <h2 className="text-lg font-semibold text-white">
          Step 1 — Create an estate
        </h2>
        <p className="mt-2 text-sm text-white/60">
          You’ll invite heirs and finalize rules once the estate is created.
        </p>
        <form className="mt-6 grid gap-4" action={createEstateFromSetup}>
          <label className="text-sm text-white/70">
            Estate name
            <input
              className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-2 text-sm text-white"
              name="name"
              required
            />
          </label>
          <label className="text-sm text-white/70">
            Description
            <textarea
              className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-2 text-sm text-white"
              name="description"
              rows={3}
            />
          </label>
          <button
            className="w-fit rounded-2xl bg-white px-5 py-2 text-sm font-semibold text-zinc-900"
            type="submit"
          >
            Create estate
          </button>
        </form>
        {user ? (
          <p className="mt-4 text-xs text-white/40">
            Signed in as {user.email}
          </p>
        ) : null}
      </section>
    </div>
  );
}
