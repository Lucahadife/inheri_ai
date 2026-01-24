import Link from "next/link";

import { createClient } from "@/data/supabase/server";

import { addMember } from "./actions";

type EstateDetailPageProps = {
  params: { estateId: string };
  searchParams?: { error?: string };
};

export default async function EstateDetailPage({
  params,
  searchParams,
}: EstateDetailPageProps) {
  const supabase = createClient();

  const { data: estate } = await supabase
    .from("estates")
    .select("id,name,description,created_at")
    .eq("id", params.estateId)
    .single();

  const { data: members } = await supabase
    .from("estate_members")
    .select("id,email,role,status,user_id")
    .eq("estate_id", params.estateId)
    .order("created_at", { ascending: true });

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-8 px-6 py-12">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Estate
          </p>
          <h1 className="mt-2 text-3xl font-semibold">
            {estate?.name ?? "Estate"}
          </h1>
          <p className="mt-2 text-sm text-zinc-500">
            {estate?.description || "No description provided yet."}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            className="rounded-2xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white"
            href={`/estates/${params.estateId}/assets`}
          >
            Manage assets
          </Link>
          <Link
            className="rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800"
            href="/estates"
          >
            Back to estates
          </Link>
        </div>
      </header>

      {searchParams?.error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {searchParams.error}
        </div>
      ) : null}

      <section className="grid gap-4 rounded-3xl border border-zinc-200 bg-white p-6">
        <h2 className="text-lg font-semibold">Invite heirs</h2>
        <form className="grid gap-4" action={addMember}>
          <input type="hidden" name="estate_id" value={params.estateId} />
          <label className="text-sm font-medium text-zinc-700">
            Email
            <input
              className="mt-2 w-full rounded-2xl border border-zinc-200 px-4 py-2 text-sm"
              name="email"
              type="email"
              required
            />
          </label>
          <label className="text-sm font-medium text-zinc-700">
            Role
            <select
              className="mt-2 w-full rounded-2xl border border-zinc-200 px-4 py-2 text-sm"
              name="role"
              defaultValue="heir"
            >
              <option value="heir">Heir</option>
              <option value="executor">Executor</option>
            </select>
          </label>
          <button
            className="w-fit rounded-2xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white"
            type="submit"
          >
            Add member
          </button>
        </form>
      </section>

      <section className="grid gap-4 rounded-3xl border border-zinc-200 bg-white p-6">
        <h2 className="text-lg font-semibold">Estate workspaces</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            className="rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800"
            href={`/estates/${params.estateId}/preferences`}
          >
            Preferences
          </Link>
          <Link
            className="rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800"
            href={`/estates/${params.estateId}/allocation`}
          >
            Allocation
          </Link>
          <Link
            className="rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800"
            href={`/estates/${params.estateId}/scenarios`}
          >
            Scenarios
          </Link>
          <Link
            className="rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800"
            href={`/estates/${params.estateId}/assets`}
          >
            Assets
          </Link>
        </div>
      </section>

      <section className="grid gap-4">
        <h2 className="text-lg font-semibold">Members</h2>
        <div className="grid gap-3">
          {members?.length ? (
            members.map((member) => (
              <div
                className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-zinc-200 bg-white px-4 py-3"
                key={member.id}
              >
                <div>
                  <p className="text-sm font-semibold text-zinc-900">
                    {member.email}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {member.user_id ? "Active user" : "Pending invite"}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase text-zinc-500">
                  <span className="rounded-full border border-zinc-200 px-3 py-1">
                    {member.role}
                  </span>
                  <span className="rounded-full border border-zinc-200 px-3 py-1">
                    {member.status}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-zinc-200 bg-white px-4 py-6 text-sm text-zinc-500">
              No members yet.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
