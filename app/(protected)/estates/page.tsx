import Link from "next/link";

import { createClient } from "@/data/supabase/server";

import { createEstate } from "./actions";

type EstatesPageProps = {
  searchParams?: { error?: string };
};

export default async function EstatesPage({ searchParams }: EstatesPageProps) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: memberships } = await supabase
    .from("estate_members")
    .select("role,status,estate:estates(id,name,description,created_at)")
    .eq("user_id", user?.id ?? "")
    .eq("status", "active")
    .order("created_at", { foreignTable: "estates", ascending: false });

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-8 px-6 py-12">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Estates
        </p>
        <h1 className="mt-2 text-3xl font-semibold">Your estates</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Create a new estate or continue working on an existing one.
        </p>
      </header>

      {searchParams?.error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {searchParams.error}
        </div>
      ) : null}

      <section className="grid gap-4 rounded-3xl border border-zinc-200 bg-white p-6">
        <h2 className="text-lg font-semibold">Create an estate</h2>
        <form className="grid gap-4" action={createEstate}>
          <label className="text-sm font-medium text-zinc-700">
            Estate name
            <input
              className="mt-2 w-full rounded-2xl border border-zinc-200 px-4 py-2 text-sm"
              name="name"
              required
            />
          </label>
          <label className="text-sm font-medium text-zinc-700">
            Description
            <textarea
              className="mt-2 w-full rounded-2xl border border-zinc-200 px-4 py-2 text-sm"
              name="description"
              rows={3}
            />
          </label>
          <button
            className="w-fit rounded-2xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white"
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
                  className="rounded-2xl border border-zinc-200 bg-white p-4 transition hover:border-zinc-300"
                  href={`/estates/${membership.estate.id}`}
                  key={membership.estate.id}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-base font-semibold text-zinc-900">
                        {membership.estate.name}
                      </p>
                      <p className="text-sm text-zinc-500">
                        {membership.estate.description || "No description"}
                      </p>
                    </div>
                    <span className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-semibold uppercase text-zinc-500">
                      {membership.role}
                    </span>
                  </div>
                </Link>
              ) : null
            )
          ) : (
            <div className="rounded-2xl border border-dashed border-zinc-200 bg-white px-4 py-6 text-sm text-zinc-500">
              You do not belong to any estates yet.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
