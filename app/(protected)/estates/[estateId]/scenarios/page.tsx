import Link from "next/link";

import { createClient } from "@/data/supabase/server";

import { toggleScenarioItem } from "./actions";

type ScenariosPageProps = {
  params: { estateId: string };
  searchParams?: { error?: string };
};

type AssetRecord = {
  id: string;
  name: string;
  value_low: number | null;
  value_high: number | null;
};

const getMidpoint = (asset: AssetRecord) => {
  if (asset.value_low != null && asset.value_high != null) {
    return (asset.value_low + asset.value_high) / 2;
  }
  if (asset.value_high != null) return asset.value_high;
  if (asset.value_low != null) return asset.value_low;
  return 0;
};

export default async function ScenariosPage({
  params,
  searchParams,
}: ScenariosPageProps) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: assets } = await supabase
    .from("assets")
    .select("id,name,value_low,value_high")
    .eq("estate_id", params.estateId)
    .order("created_at", { ascending: false });

  const { data: scenarios } = await supabase
    .from("scenarios")
    .select("id,name")
    .eq("estate_id", params.estateId)
    .eq("heir_id", user?.id ?? "");

  const scenarioMap = new Map(
    (scenarios ?? []).map((scenario) => [scenario.name, scenario.id])
  );

  const scenarioIds = (scenarios ?? []).map((scenario) => scenario.id);

  const { data: scenarioItems } = scenarioIds.length
    ? await supabase
        .from("scenario_items")
        .select("scenario_id,asset_id")
        .in("scenario_id", scenarioIds)
    : { data: [] };

  const itemsByScenario = new Map<string, Set<string>>();
  (scenarioItems ?? []).forEach((item) => {
    if (!itemsByScenario.has(item.scenario_id)) {
      itemsByScenario.set(item.scenario_id, new Set());
    }
    itemsByScenario.get(item.scenario_id)?.add(item.asset_id);
  });

  const { data: preferences } = await supabase
    .from("preferences")
    .select("asset_id,emotional_score")
    .eq("heir_id", user?.id ?? "");

  const { data: boosts } = await supabase
    .from("decedent_boosts")
    .select("asset_id,boost")
    .eq("heir_id", user?.id ?? "");

  const preferenceMap = new Map(
    (preferences ?? []).map((pref) => [pref.asset_id, pref.emotional_score])
  );

  const boostMap = new Map(
    (boosts ?? []).map((boost) => [boost.asset_id, boost.boost])
  );

  const scoreForAsset = (assetId: string) =>
    (preferenceMap.get(assetId) ?? 0) + (boostMap.get(assetId) ?? 0);

  const totalsForScenario = (scenarioName: string) => {
    const scenarioId = scenarioMap.get(scenarioName);
    if (!scenarioId) {
      return { valueTotal: 0, emotionalTotal: 0, count: 0 };
    }
    const assetIds = itemsByScenario.get(scenarioId) ?? new Set<string>();
    let valueTotal = 0;
    let emotionalTotal = 0;
    (assets ?? []).forEach((asset) => {
      if (assetIds.has(asset.id)) {
        valueTotal += getMidpoint(asset as AssetRecord);
        emotionalTotal += scoreForAsset(asset.id);
      }
    });
    return { valueTotal, emotionalTotal, count: assetIds.size };
  };

  const scenarioA = totalsForScenario("A");
  const scenarioB = totalsForScenario("B");

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-8 px-6 py-12">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Scenarios
          </p>
          <h1 className="mt-2 text-3xl font-semibold">
            Scenario carts (A/B)
          </h1>
          <p className="mt-2 text-sm text-zinc-500">
            Build alternative allocations and compare totals.
          </p>
        </div>
        <Link
          className="rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800"
          href={`/estates/${params.estateId}`}
        >
          Back to estate
        </Link>
      </header>

      {searchParams?.error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {searchParams.error}
        </div>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-3xl border border-zinc-200 bg-white p-6">
          <h2 className="text-lg font-semibold">Scenario A</h2>
          <p className="mt-2 text-sm text-zinc-500">
            {scenarioA.count} assets · ${scenarioA.valueTotal.toFixed(0)} value ·{" "}
            {scenarioA.emotionalTotal} emotional points
          </p>
        </div>
        <div className="rounded-3xl border border-zinc-200 bg-white p-6">
          <h2 className="text-lg font-semibold">Scenario B</h2>
          <p className="mt-2 text-sm text-zinc-500">
            {scenarioB.count} assets · ${scenarioB.valueTotal.toFixed(0)} value ·{" "}
            {scenarioB.emotionalTotal} emotional points
          </p>
        </div>
      </section>

      <section className="grid gap-4">
        <h2 className="text-lg font-semibold">Asset selection</h2>
        <div className="grid gap-3">
          {assets?.length ? (
            assets.map((asset) => {
              const assetId = asset.id;
              const scenarioAId = scenarioMap.get("A");
              const scenarioBId = scenarioMap.get("B");
              const inA = scenarioAId
                ? itemsByScenario.get(scenarioAId)?.has(assetId)
                : false;
              const inB = scenarioBId
                ? itemsByScenario.get(scenarioBId)?.has(assetId)
                : false;

              return (
                <div
                  className="rounded-2xl border border-zinc-200 bg-white p-4"
                  key={asset.id}
                >
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-zinc-900">
                        {asset.name}
                      </p>
                      <p className="text-xs text-zinc-500">
                        Value midpoint ${getMidpoint(asset as AssetRecord).toFixed(0)}
                      </p>
                      <p className="text-xs text-zinc-500">
                        Emotional points {scoreForAsset(asset.id)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <form action={toggleScenarioItem}>
                        <input
                          type="hidden"
                          name="estate_id"
                          value={params.estateId}
                        />
                        <input type="hidden" name="asset_id" value={asset.id} />
                        <input type="hidden" name="scenario_name" value="A" />
                        <button
                          className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase ${
                            inA
                              ? "border-zinc-900 bg-zinc-900 text-white"
                              : "border-zinc-200 text-zinc-600"
                          }`}
                          type="submit"
                        >
                          {inA ? "Remove A" : "Add A"}
                        </button>
                      </form>
                      <form action={toggleScenarioItem}>
                        <input
                          type="hidden"
                          name="estate_id"
                          value={params.estateId}
                        />
                        <input type="hidden" name="asset_id" value={asset.id} />
                        <input type="hidden" name="scenario_name" value="B" />
                        <button
                          className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase ${
                            inB
                              ? "border-zinc-900 bg-zinc-900 text-white"
                              : "border-zinc-200 text-zinc-600"
                          }`}
                          type="submit"
                        >
                          {inB ? "Remove B" : "Add B"}
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="rounded-2xl border border-dashed border-zinc-200 bg-white px-4 py-6 text-sm text-zinc-500">
              No assets yet.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
