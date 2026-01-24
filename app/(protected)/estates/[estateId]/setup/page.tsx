import Link from "next/link";

import { createClient } from "@/data/supabase/server";

import { acceptRule, addMemberInSetup, addRule } from "./actions";

type EstateSetupPageProps = {
  params: { estateId: string };
  searchParams?: { error?: string } | Promise<{ error?: string }>;
};

const ruleTemplates = [
  {
    type: "equal_split",
    title: "Equal split",
    description: "Keep total market value per heir as equal as possible.",
  },
  {
    type: "keep_major_property_intact",
    title: "Keep major property intact",
    description: "Avoid splitting large assets unless needed.",
  },
  {
    type: "avoid_splitting",
    title: "Prefer fewer, larger transfers",
    description: "Minimize splitting small items across heirs.",
  },
];

export default async function EstateSetupPage({
  params,
  searchParams,
}: EstateSetupPageProps) {
  const resolvedSearchParams = await Promise.resolve(searchParams);
  const supabase = await createClient();

  const { data: estate } = await supabase
    .from("estates")
    .select("id,name,description")
    .eq("id", params.estateId)
    .single();

  const { data: members } = await supabase
    .from("estate_members")
    .select("id,email,role,status,user_id")
    .eq("estate_id", params.estateId)
    .order("created_at", { ascending: true });

  const { data: rules } = await supabase
    .from("estate_rules")
    .select("id,rule_type,title,description,created_by,created_at")
    .eq("estate_id", params.estateId)
    .order("created_at", { ascending: true });

  const { data: acceptances } = await supabase
    .from("estate_rule_acceptances")
    .select("estate_rule_id,user_id")
    .in(
      "estate_rule_id",
      (rules ?? []).map((rule) => rule.id)
    );

  const acceptanceMap = new Map<string, Set<string>>();
  (acceptances ?? []).forEach((acceptance) => {
    if (!acceptanceMap.has(acceptance.estate_rule_id)) {
      acceptanceMap.set(acceptance.estate_rule_id, new Set());
    }
    acceptanceMap.get(acceptance.estate_rule_id)?.add(acceptance.user_id);
  });

  const { data: currentUser } = await supabase.auth.getUser();

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-10 px-6 py-16 text-white">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/40">
            Estate setup
          </p>
          <h1 className="mt-2 text-3xl font-semibold">
            {estate?.name ?? "Estate setup"}
          </h1>
          <p className="mt-2 text-sm text-white/60">
            Invite heirs and lock the rules before adding assets.
          </p>
        </div>
        <Link
          className="rounded-2xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold"
          href={`/estates/${params.estateId}`}
        >
          Go to estate hub
        </Link>
      </header>

      {resolvedSearchParams?.error ? (
        <div className="rounded-2xl border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {resolvedSearchParams.error}
        </div>
      ) : null}

      <section className="grid gap-6 rounded-3xl border border-white/10 bg-white/5 p-8">
        <h2 className="text-lg font-semibold">Step 2 — Invite heirs</h2>
        <form className="grid gap-4" action={addMemberInSetup}>
          <input type="hidden" name="estate_id" value={params.estateId} />
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm text-white/70">
              Email
              <input
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-2 text-sm text-white"
                name="email"
                type="email"
                required
              />
            </label>
            <label className="text-sm text-white/70">
              Role
              <select
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-2 text-sm text-white"
                name="role"
                defaultValue="heir"
              >
                <option value="heir">Heir</option>
                <option value="executor">Executor</option>
              </select>
            </label>
          </div>
          <button
            className="w-fit rounded-2xl bg-white px-5 py-2 text-sm font-semibold text-zinc-900"
            type="submit"
          >
            Add member
          </button>
        </form>
        <div className="grid gap-3">
          {(members ?? []).map((member) => (
            <div
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm"
              key={member.id}
            >
              <div>
                <p className="font-semibold text-white">{member.email}</p>
                <p className="text-xs text-white/50">
                  {member.user_id ? "Active" : "Pending"}
                </p>
              </div>
              <span className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase text-white/60">
                {member.role}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 rounded-3xl border border-white/10 bg-white/5 p-8">
        <h2 className="text-lg font-semibold">Step 3 — Estate rules</h2>
        <form className="grid gap-4" action={addRule}>
          <input type="hidden" name="estate_id" value={params.estateId} />
          <label className="text-sm text-white/70">
            Rule template
            <select
              className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-2 text-sm text-white"
              name="rule_type"
            >
              {ruleTemplates.map((rule) => (
                <option key={rule.type} value={rule.type}>
                  {rule.title}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-white/70">
            Title
            <input
              className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-2 text-sm text-white"
              name="title"
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
            Add rule
          </button>
        </form>
        <div className="grid gap-4">
          {(rules ?? []).map((rule) => {
            const acceptedBy = acceptanceMap.get(rule.id) ?? new Set();
            const isAccepted = currentUser.data.user
              ? acceptedBy.has(currentUser.data.user.id)
              : false;

            return (
              <div
                className="rounded-2xl border border-white/10 bg-black/30 px-4 py-4"
                key={rule.id}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {rule.title}
                    </p>
                    <p className="text-xs text-white/60">{rule.description}</p>
                  </div>
                  <form action={acceptRule}>
                    <input
                      type="hidden"
                      name="estate_id"
                      value={params.estateId}
                    />
                    <input type="hidden" name="rule_id" value={rule.id} />
                    <button
                      className={`rounded-full border px-3 py-1 text-xs uppercase ${
                        isAccepted
                          ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-200"
                          : "border-white/20 text-white/70"
                      }`}
                      type="submit"
                    >
                      {isAccepted ? "Accepted" : "Accept"}
                    </button>
                  </form>
                </div>
                <p className="mt-3 text-xs text-white/40">
                  Accepted by {acceptedBy.size} member(s)
                </p>
              </div>
            );
          })}
          {!rules?.length ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-black/30 px-4 py-6 text-sm text-white/50">
              No rules yet. Add rules that everyone must agree to.
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
