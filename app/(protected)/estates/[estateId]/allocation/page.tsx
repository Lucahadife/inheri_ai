import Link from "next/link";

import { createClient } from "@/data/supabase/server";
import {
  buildAllocationPlans,
  suggestTrades,
  type Asset,
  type Heir,
  type Preference,
} from "@/logic/allocation";
import AiResolve from "@/ui/AiResolve";

type AllocationPageProps = {
  params: { estateId: string };
};

export default async function AllocationPage({ params }: AllocationPageProps) {
  const supabase = createClient();

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

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-6 py-12">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Allocation
          </p>
          <h1 className="mt-2 text-3xl font-semibold">Allocation proposals</h1>
          <p className="mt-2 text-sm text-zinc-500">
            Rule-based plans that balance market value and emotional scores.
          </p>
        </div>
        <Link
          className="rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800"
          href={`/estates/${params.estateId}`}
        >
          Back to estate
        </Link>
      </header>

      <section className="grid gap-6">
        {[planA, planB].map((plan) => (
          <div
            className="rounded-3xl border border-zinc-200 bg-white p-6"
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
                    className="rounded-2xl border border-zinc-200 px-4 py-3"
                    key={heir.id}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-zinc-900">
                          {heir.name}
                        </p>
                        <p className="text-xs text-zinc-500">
                          Value ${totals.valueTotal.toFixed(0)} · Emotional{" "}
                          {totals.emotionalTotal} · Delta{" "}
                          {totals.deltaFromTarget.toFixed(0)}
                        </p>
                      </div>
                      <div className="text-xs text-zinc-500">
                        {assetsForHeir.length} assets
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {assetsForHeir.map((asset) => (
                        <span
                          className="rounded-full border border-zinc-200 px-3 py-1 text-xs text-zinc-500"
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

      <section className="grid gap-4 rounded-3xl border border-zinc-200 bg-white p-6">
        <h2 className="text-lg font-semibold">Trade suggestions (Plan A)</h2>
        <div className="grid gap-3">
          {planATrades.length ? (
            planATrades.map((trade) => (
              <div
                className="rounded-2xl border border-zinc-200 px-4 py-3 text-sm text-zinc-700"
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
            <div className="rounded-2xl border border-dashed border-zinc-200 px-4 py-6 text-sm text-zinc-500">
              No trade suggestions at this time.
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-4">
        <h2 className="text-lg font-semibold">AI dispute helper</h2>
        <AiResolve />
      </section>
    </div>
  );
}
