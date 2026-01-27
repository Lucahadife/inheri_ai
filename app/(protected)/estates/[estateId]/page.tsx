import Link from "next/link";

import { createClient } from "@/data/supabase/server";
import DonutChart from "@/ui/DonutChart";
import ProgressSteps from "@/ui/ProgressSteps";

export const dynamic = "force-dynamic";

type EstateDetailPageProps = {
  params: Promise<{ estateId: string }>;
  searchParams?: Promise<{ error?: string }>;
};

export default async function EstateDetailPage({
  params,
  searchParams,
}: EstateDetailPageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const estateId = resolvedParams.estateId;
  const supabase = await createClient();

  const { data: estate } = await supabase
    .from("estates")
    .select("id,name,description,created_at")
    .eq("id", estateId)
    .single();

  const { data: members } = await supabase
    .from("estate_members")
    .select("id,email,role,status,user_id")
    .eq("estate_id", estateId)
    .order("created_at", { ascending: true });

  const { data: assets } = await supabase
    .from("assets")
    .select(
      "id,name,asset_category,asset_type,value_low,value_high,ai_value_low,ai_value_high"
    )
    .eq("estate_id", estateId);

  const assetIds = (assets ?? []).map((asset) => asset.id);

  const { data: rules } = await supabase
    .from("estate_rules")
    .select("id")
    .eq("estate_id", estateId);

  const { data: preferences } = assetIds.length
    ? await supabase
        .from("preferences")
        .select("heir_id,asset_id")
        .in("asset_id", assetIds)
    : { data: [] };

  const { data: scenarios } = await supabase
    .from("scenarios")
    .select("heir_id,name")
    .eq("estate_id", estateId);

  const activeHeirs = (members ?? [])
    .filter((member) => member.user_id && member.role === "heir")
    .map((member) => member.user_id as string);

  const heirsWithPrefs = new Set((preferences ?? []).map((pref) => pref.heir_id));
  const scenarioHeirs = new Set((scenarios ?? []).map((scenario) => scenario.heir_id));

  const steps = [
    {
      title: "Estate rules confirmed",
      status: rules?.length ? "complete" : "incomplete",
      description: rules?.length
        ? "Rules are set for this estate."
        : "Add rules and collect agreement.",
    },
    {
      title: "Assets added",
      status: assets?.length ? "complete" : "incomplete",
      description: assets?.length
        ? `${assets.length} assets tracked.`
        : "Add the first asset.",
    },
    {
      title: "Preferences submitted",
      status:
        activeHeirs.length > 0 &&
        activeHeirs.every((heirId) => heirsWithPrefs.has(heirId))
          ? "complete"
          : "incomplete",
      description: "Each heir should submit emotional scores.",
    },
    {
      title: "Scenarios drafted",
      status:
        activeHeirs.length > 0 &&
        activeHeirs.every((heirId) => scenarioHeirs.has(heirId))
          ? "complete"
          : "incomplete",
      description: "Scenarios A/B help compare allocations.",
    },
  ];

  const estimateForAsset = (asset: {
    value_low: number | null;
    value_high: number | null;
    ai_value_low: number | null;
    ai_value_high: number | null;
  }) => {
    const low = asset.ai_value_low ?? asset.value_low ?? 0;
    const high = asset.ai_value_high ?? asset.value_high ?? low;
    return { low, high, mid: (low + high) / 2 };
  };

  const totals = (assets ?? []).reduce(
    (acc, asset) => {
      const estimate = estimateForAsset(asset);
      acc.low += estimate.low;
      acc.high += estimate.high;
      acc.mid += estimate.mid;
      return acc;
    },
    { low: 0, high: 0, mid: 0 }
  );

  const categoryTotals = new Map<string, number>();
  (assets ?? []).forEach((asset) => {
    const category = asset.asset_category || asset.asset_type || "Uncategorized";
    const estimate = estimateForAsset(asset).mid;
    categoryTotals.set(category, (categoryTotals.get(category) ?? 0) + estimate);
  });

  const categorySegments = Array.from(categoryTotals.entries()).map(
    ([label, value], index) => ({
      label,
      value,
      color: ["#6366f1", "#22c55e", "#f97316", "#e879f9", "#38bdf8"][
        index % 5
      ],
    })
  );

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-10 px-6 py-16 text-white">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/40">
            Estate hub
          </p>
          <h1 className="mt-2 text-3xl font-semibold">
            {estate?.name ?? "Estate"}
          </h1>
          <p className="mt-2 text-sm text-white/60">
            {estate?.description || "No description provided yet."}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            className="rounded-2xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold"
            href={`/estates/${estateId}/setup`}
          >
            Setup checklist
          </Link>
          <Link
            className="rounded-2xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold"
            href="/estates"
          >
            Back to estates
          </Link>
        </div>
      </header>

      {resolvedSearchParams?.error ? (
        <div className="rounded-2xl border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {resolvedSearchParams.error}
        </div>
      ) : null}

      <section className="grid gap-6 rounded-3xl border border-white/10 bg-white/5 p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Estate valuation</h2>
            <p className="text-sm text-white/60">
              Low ${totals.low.toFixed(0)} · Mid ${totals.mid.toFixed(0)} · High $
              {totals.high.toFixed(0)}
            </p>
          </div>
          <Link
            className="rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-zinc-900"
            href={`/estates/${estateId}/assets`}
          >
            Add assets
          </Link>
        </div>
        <DonutChart segments={categorySegments} total={totals.mid} />
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
          <h2 className="text-lg font-semibold">Estate workspaces</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {[
              { label: "Assets", href: "assets" },
              { label: "Preferences & Scenarios", href: "preferences" },
              { label: "Allocation", href: "allocation" },
              { label: "Disputes", href: "disputes" },
              { label: "Final docs", href: "final" },
            ].map((item) => (
              <Link
                className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm font-semibold"
                href={`/estates/${estateId}/${item.href}`}
                key={item.label}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
          <h2 className="text-lg font-semibold">Progress tracker</h2>
          <p className="mt-2 text-sm text-white/60">
            Complete each step before generating final allocations.
          </p>
          <div className="mt-4">
            <ProgressSteps steps={steps} />
          </div>
        </div>
      </section>

      <section className="grid gap-4">
        <h2 className="text-lg font-semibold">Members</h2>
        <div className="grid gap-3">
          {members?.length ? (
            members.map((member) => (
              <div
                className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/30 px-4 py-3"
                key={member.id}
              >
                <div>
                  <p className="text-sm font-semibold text-white">
                    {member.email}
                  </p>
                  <p className="text-xs text-white/50">
                    {member.user_id ? "Active user" : "Pending invite"}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase text-white/60">
                  <span className="rounded-full border border-white/10 px-3 py-1">
                    {member.role}
                  </span>
                  <span className="rounded-full border border-white/10 px-3 py-1">
                    {member.status}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-white/10 bg-black/30 px-4 py-6 text-sm text-white/60">
              No members yet.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
