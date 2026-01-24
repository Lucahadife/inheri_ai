import Link from "next/link";

import { createClient } from "@/data/supabase/server";

export const dynamic = "force-dynamic";

import { createEstate } from "./actions";

type EstatesPageProps = {
  searchParams?: { error?: string } | Promise<{ error?: string }>;
};

export default async function EstatesPage({ searchParams }: EstatesPageProps) {
  const resolvedSearchParams = await Promise.resolve(searchParams);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-10 px-6 py-16 text-white">
        <div className="rounded-2xl border border-rose-400/40 bg-rose-500/10 px-4 py-6 text-sm text-rose-100">
          Unable to load your user session. Please log in again.
        </div>
      </div>
    );
  }

  const { data: memberships, error: membershipsError } = await supabase
    .from("estate_members")
    .select("role,status,estate:estates(id,name,description,created_at)")
    .or(`user_id.eq.${user.id},email.eq.${user.email}`)
    .order("created_at", { foreignTable: "estates", ascending: false });

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-10 px-6 py-16 text-white">
      <header>
        <p className="text-xs uppercase tracking-[0.3em] text-white/40">
          Estates
        </p>
        <h1 className="mt-2 text-3xl font-semibold">Your estates</h1>
        <p className="mt-2 text-sm text-white/60">
          Create a new estate or continue working on an existing one.
        </p>
      </header>

      {membershipsError ? (
        <div className="rounded-2xl border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {membershipsError.message}
        </div>
      ) : null}

      {resolvedSearchParams?.error ? (
        <div className="rounded-2xl border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {resolvedSearchParams.error}
        </div>
      ) : null}

      <section className="grid gap-4 rounded-3xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-lg font-semibold">Create an estate</h2>
        <form className="grid gap-4" action={createEstate}>
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
            className="w-fit rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-zinc-900"
            type="submit"
          >
            Create estate
          </button>
        </form>
      </section>

      <section className="grid gap-4">
        <h2 className="text-lg font-semibold">Estate list</h2>
        <div className="grid gap-3">
          {memberships?.length ? (
            memberships.map((membership) =>
              membership.estate ? (
                <Link
                  className="rounded-2xl border border-white/10 bg-black/30 p-4 transition hover:border-white/30"
                  href={`/estates/${membership.estate.id}`}
                  key={membership.estate.id}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-base font-semibold text-white">
                        {membership.estate.name}
                      </p>
                      <p className="text-sm text-white/60">
                        {membership.estate.description || "No description"}
                      </p>
                    </div>
                    <span className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold uppercase text-white/60">
                      {membership.role}
                    </span>
                    <span className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold uppercase text-white/60">
                      {membership.status}
                    </span>
                  </div>
                </Link>
              ) : null
            )
          ) : (
            <div className="rounded-2xl border border-dashed border-white/10 bg-black/30 px-4 py-6 text-sm text-white/50">
              You do not belong to any estates yet.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
