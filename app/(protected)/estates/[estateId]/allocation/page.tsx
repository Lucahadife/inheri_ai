import Link from "next/link";

import { getRuleAcceptanceStatus } from "@/data/estate";
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

export const dynamic = "force-dynamic";

type AllocationPageProps = {
  params: Promise<{ estateId: string }>;
};

export default async function AllocationPage({ params }: AllocationPageProps) {
  const resolvedParams = await params;
  const estateId = resolvedParams.estateId;
  const supabase = await createClient();

  const { data: assets } = await supabase
    .from("assets")
    .select("id,name,value_low,value_high,ai_value_low,ai_value_high")
    .eq("estate_id", estateId);

  const { data: members } = await supabase
    .from("estate_members")
    .select("user_id,email,status")
    .eq("estate_id", estateId)
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
    .eq("estate_id", estateId);

  const rulesStatus = await getRuleAcceptanceStatus(
    supabase as any,
    estateId
  );
  const rulesReady = rulesStatus.rulesAccepted;

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
    aiValueLow: asset.ai_value_low,
    aiValueHigh: asset.ai_value_high,
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

  // Calculate total estate value
  const totalEstateValue = assetRecords.reduce((sum, asset) => {
    const low = asset.aiValueLow ?? asset.valueLow ?? 0;
    const high = asset.aiValueHigh ?? asset.valueHigh ?? low;
    return sum + (low + high) / 2;
  }, 0);
  const targetSharePerHeir = heirs.length ? totalEstateValue / heirs.length : 0;

  const hasAssets = assetRecords.length > 0;
  const hasHeirs = heirs.length > 0;
  const hasPreferences = preferenceList.length > 0;

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-10 px-6 py-16 text-white">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/40">
            Allocation
          </p>
          <h1 className="mt-2 text-3xl font-semibold">Allocation proposals</h1>
          <p className="mt-2 text-sm text-white/60">
            AI-assisted plans that balance market value and emotional preferences.
          </p>
        </div>
        <Link
          className="rounded-2xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold"
          href={`/estates/${estateId}`}
        >
          Back to estate
        </Link>
      </header>

      {/* Estate Summary */}
      <section className="grid gap-4 rounded-3xl border border-white/10 bg-gradient-to-br from-emerald-500/10 to-transparent p-6">
        <h2 className="text-lg font-semibold">Estate Summary</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="text-xs text-white/50">Total Estate Value</p>
            <p className="mt-1 text-2xl font-bold text-emerald-400">
              ${totalEstateValue.toLocaleString()}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="text-xs text-white/50">Number of Heirs</p>
            <p className="mt-1 text-2xl font-bold text-white">{heirs.length}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="text-xs text-white/50">Target Share Per Heir</p>
            <p className="mt-1 text-2xl font-bold text-white">
              ${targetSharePerHeir.toLocaleString()}
            </p>
          </div>
        </div>
      </section>

      {/* Warnings */}
      {!hasAssets && (
        <div className="rounded-2xl border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          No assets added yet. <Link href={`/estates/${estateId}/assets`} className="underline">Add assets</Link> to generate allocation plans.
        </div>
      )}
      {!hasHeirs && (
        <div className="rounded-2xl border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          No heirs in this estate. <Link href={`/estates/${estateId}/setup`} className="underline">Invite heirs</Link> to generate allocation plans.
        </div>
      )}
      {hasAssets && hasHeirs && !hasPreferences && (
        <div className="rounded-2xl border border-blue-400/40 bg-blue-500/10 px-4 py-3 text-sm text-blue-100">
          No emotional preferences set yet. Plans are based on value only. <Link href={`/estates/${estateId}/preferences`} className="underline">Set preferences</Link> for better results.
        </div>
      )}
      {!rulesReady && (
        <div className="rounded-2xl border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          Rules are not fully accepted. Allocation results may change once all heirs agree.
        </div>
      )}

      {/* How It Works */}
      <section className="grid gap-4 rounded-3xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-lg font-semibold">How Allocation Works</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <h3 className="font-semibold text-emerald-400">Plan A: Value-First</h3>
            <p className="mt-2 text-sm text-white/60">
              Prioritizes equal monetary distribution. Assigns high-value assets first 
              to whoever has received the least so far. Uses emotional scores as a tiebreaker.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <h3 className="font-semibold text-purple-400">Plan B: Emotion-First</h3>
            <p className="mt-2 text-sm text-white/60">
              Prioritizes emotional attachment. Assigns assets to whoever wants them most, 
              while keeping each heir within 10% of equal share to maintain fairness.
            </p>
          </div>
        </div>
      </section>

      {/* Allocation Plans */}
      {hasAssets && hasHeirs ? (
        <section className="grid gap-6">
          {[planA, planB].map((plan) => {
            const isValueFirst = plan.name.includes("value");
            return (
              <div
                className={`rounded-3xl border p-6 ${
                  isValueFirst 
                    ? "border-emerald-400/20 bg-gradient-to-br from-emerald-500/10 to-transparent" 
                    : "border-purple-400/20 bg-gradient-to-br from-purple-500/10 to-transparent"
                }`}
                key={plan.name}
              >
                <div className="flex items-center gap-3">
                  <div className={`h-3 w-3 rounded-full ${isValueFirst ? "bg-emerald-400" : "bg-purple-400"}`} />
                  <h2 className="text-xl font-semibold">{plan.name}</h2>
                </div>
                <div className="mt-4 grid gap-3">
                  {heirs.map((heir) => {
                    const totals = plan.totalsByHeir[heir.id];
                    const assetsForHeir = assetRecords.filter(
                      (asset) => plan.assignments[asset.id] === heir.id
                    );
                    const deltaPercent = targetSharePerHeir > 0 
                      ? ((totals.deltaFromTarget / targetSharePerHeir) * 100).toFixed(1)
                      : "0";
                    const isOverTarget = totals.deltaFromTarget > 0;
                    
                    return (
                      <div
                        className="rounded-2xl border border-white/10 bg-black/30 px-4 py-4"
                        key={heir.id}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div>
                            <p className="text-sm font-semibold text-white">
                              {heir.name}
                            </p>
                            <div className="mt-2 flex flex-wrap gap-3 text-xs">
                              <span className="rounded-full bg-white/10 px-3 py-1">
                                💰 ${totals.valueTotal.toLocaleString()}
                              </span>
                              <span className="rounded-full bg-white/10 px-3 py-1">
                                ❤️ {totals.emotionalTotal} points
                              </span>
                              <span className={`rounded-full px-3 py-1 ${
                                Math.abs(parseFloat(deltaPercent)) < 5 
                                  ? "bg-emerald-500/20 text-emerald-300"
                                  : Math.abs(parseFloat(deltaPercent)) < 15
                                    ? "bg-amber-500/20 text-amber-300"
                                    : "bg-rose-500/20 text-rose-300"
                              }`}>
                                {isOverTarget ? "+" : ""}{deltaPercent}% from target
                              </span>
                            </div>
                          </div>
                          <div className="text-xs text-white/60">
                            {assetsForHeir.length} {assetsForHeir.length === 1 ? "asset" : "assets"}
                          </div>
                        </div>
                        {assetsForHeir.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {assetsForHeir.map((asset) => (
                            <span
                              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70"
                              key={asset.id}
                            >
                              {asset.name}
                            </span>
                          ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </section>
      ) : null}

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
