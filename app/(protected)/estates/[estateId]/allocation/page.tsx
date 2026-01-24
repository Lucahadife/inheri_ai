import Link from "next/link";

import { createClient } from "@/data/supabase/server";
import {
  buildAllocationPlans,
  suggestTrades,
  type Asset,
  type Heir,
  type Preference,
} from "@/logic/allocation";
import AiFairness from "@/ui/AiFairness";
import AiResolve from "@/ui/AiResolve";

type AllocationPageProps = {
  params: { estateId: string };
};

export default async function AllocationPage({ params }: AllocationPageProps) {
  const supabase = await createClient();

  const { data: assets } = await supabase
    .from("assets")
    .select("id,name,value_low,value_high")
    .eq("estate_id", params.estateId);

  const { data: members } = await supabase
    .from("estate_members")
    .select("user_id,email,status")
    .eq("estate_id", params.estateId)
    .eq("status", "active");

  const assetIds = (assets ?? []).map((asset) => asset.id);

  const { data: preferences } = assetIds.length
    ? await supabase
        .from("preferences")
        .select("asset_id,heir_id,emotional_score")
        .in("asset_id", assetIds)
    : { data: [] };

  const { data: boosts } = assetIds.length
    ? await supabase
        .from("decedent_boosts")
        .select("asset_id,heir_id,boost")
        .in("asset_id", assetIds)
    : { data: [] };

  const { data: rules } = await supabase
    .from("estate_rules")
    .select("title,description")
    .eq("estate_id", params.estateId);

  const heirs: Heir[] = (members ?? [])
    .filter((member) => member.user_id)
    .map((member) => ({
      id: member.user_id as string,
      name: member.email ?? "Heir",
    }));

  const assetRecords: Asset[] = (assets ?? []).map((asset) => ({
    id: asset.id,
    name: asset.name,
    valueLow: asset.value_low,
    valueHigh: asset.value_high,
  }));

  const preferenceMap = new Map<string, Preference>();

  (preferences ?? []).forEach((pref) => {
    preferenceMap.set(`${pref.asset_id}:${pref.heir_id}`, {
      assetId: pref.asset_id,
      heirId: pref.heir_id,
      emotionalScore: pref.emotional_score,
      decedentBoost: 0,
    });
  });

  (boosts ?? []).forEach((boost) => {
    const key = `${boost.asset_id}:${boost.heir_id}`;
    const existing = preferenceMap.get(key);
    if (existing) {
      existing.decedentBoost = boost.boost;
    } else {
      preferenceMap.set(key, {
        assetId: boost.asset_id,
        heirId: boost.heir_id,
        emotionalScore: 0,
        decedentBoost: boost.boost,
      });
    }
  });

  const preferenceList = Array.from(preferenceMap.values());

  const { planA, planB } = buildAllocationPlans(
    heirs,
    assetRecords,
    preferenceList
  );

  const planATrades = suggestTrades(planA, heirs, assetRecords, preferenceList);

  const allocationSummary = JSON.stringify({
    planA,
    planB,
  });

  const preferenceSummary = JSON.stringify(preferenceList);
  const rulesSummary = JSON.stringify(rules ?? []);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-10 px-6 py-16 text-white">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/40">
            Allocation
          </p>
          <h1 className="mt-2 text-3xl font-semibold">Allocation proposals</h1>
          <p className="mt-2 text-sm text-white/60">
            Rule-based plans that balance market value and emotional scores.
          </p>
        </div>
        <Link
          className="rounded-2xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold"
          href={`/estates/${params.estateId}`}
        >
          Back to estate
        </Link>
      </header>

      <section className="grid gap-6">
        {[planA, planB].map((plan) => (
          <div
            className="rounded-3xl border border-white/10 bg-white/5 p-6"
            key={plan.name}
          >
            <h2 className="text-xl font-semibold">{plan.name}</h2>
            <div className="mt-4 grid gap-3">
              {heirs.map((heir) => {
                const totals = plan.totalsByHeir[heir.id];
                const assetsForHeir = assetRecords.filter(
                  (asset) => plan.assignments[asset.id] === heir.id
                );
                return (
                  <div
                    className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3"
                    key={heir.id}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-white">
                          {heir.name}
                        </p>
                        <p className="text-xs text-white/60">
                          Value ${totals.valueTotal.toFixed(0)} · Emotional{" "}
                          {totals.emotionalTotal} · Delta{" "}
                          {totals.deltaFromTarget.toFixed(0)}
                        </p>
                      </div>
                      <div className="text-xs text-white/60">
                        {assetsForHeir.length} assets
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {assetsForHeir.map((asset) => (
                        <span
                          className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/60"
                          key={asset.id}
                        >
                          {asset.name}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </section>

      <section className="grid gap-4 rounded-3xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-lg font-semibold">Trade suggestions (Plan A)</h2>
        <div className="grid gap-3">
          {planATrades.length ? (
            planATrades.map((trade) => (
              <div
                className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/70"
                key={`${trade.assetId}-${trade.toHeirId}`}
              >
                Move {trade.assetName} to{" "}
                {heirs.find((heir) => heir.id === trade.toHeirId)?.name ??
                  "heir"}
                . {trade.counterAssetName
                  ? `Swap with ${trade.counterAssetName}.`
                  : "Balance with a cash adjustment."}{" "}
                {trade.reason}
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-sm text-white/50">
              No trade suggestions at this time.
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <AiFairness
          allocationSummary={allocationSummary}
          preferenceSummary={preferenceSummary}
          rulesSummary={rulesSummary}
        />
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-semibold text-white">
            AI fairness narrative
          </h2>
          <p className="mt-2 text-sm text-white/60">
            Use the dispute helper to explore alternative swaps and settle
            conflicting preferences.
          </p>
          <div className="mt-4">
            <AiResolve />
          </div>
        </div>
      </section>
    </div>
  );
}
