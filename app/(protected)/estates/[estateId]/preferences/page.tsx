import Link from "next/link";

import { createClient } from "@/data/supabase/server";
import ScenarioBoard from "@/ui/ScenarioBoard";

import { upsertBoost } from "./actions";

type PreferencesPageProps = {
  params: { estateId: string };
  searchParams?: { error?: string } | Promise<{ error?: string }>;
};

export default async function PreferencesPage({
  params,
  searchParams,
}: PreferencesPageProps) {
  const resolvedSearchParams = await Promise.resolve(searchParams);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: membership } = await supabase
    .from("estate_members")
    .select("role")
    .eq("estate_id", params.estateId)
    .eq("user_id", user?.id ?? "")
    .single();

  const isAdmin = membership?.role === "admin" || membership?.role === "executor";

  const { data: assets } = await supabase
    .from("assets")
    .select(
      "id,name,description,value_low,value_high,ai_value_low,ai_value_high"
    )
    .eq("estate_id", params.estateId)
    .order("created_at", { ascending: false });

  const { data: preferences } = await supabase
    .from("preferences")
    .select("asset_id,emotional_score,note")
    .eq("heir_id", user?.id ?? "");

  const { data: members } = await supabase
    .from("estate_members")
    .select("id,email,user_id,status,role")
    .eq("estate_id", params.estateId)
    .eq("status", "active");

  const memberMap = new Map(
    (members ?? [])
      .filter((member) => member.user_id)
      .map((member) => [member.user_id as string, member.email])
  );

  const assetIds = (assets ?? []).map((asset) => asset.id);
  const { data: boosts } = assetIds.length
    ? await supabase
        .from("decedent_boosts")
        .select("id,asset_id,heir_id,boost,note")
        .in("asset_id", assetIds)
    : { data: [] };

  const { data: scenarios } = await supabase
    .from("scenarios")
    .select("id,name")
    .eq("estate_id", params.estateId)
    .eq("heir_id", user?.id ?? "");

  const { data: scenarioItems } = scenarios?.length
    ? await supabase
        .from("scenario_items")
        .select("scenario_id,asset_id")
        .in(
          "scenario_id",
          scenarios.map((scenario) => scenario.id)
        )
    : { data: [] };

  const scenarioMap = new Map(
    (scenarios ?? []).map((scenario) => [scenario.id, scenario.name])
  );

  const boardItems = (scenarioItems ?? []).map((item) => ({
    scenario: scenarioMap.get(item.scenario_id) ?? "A",
    assetId: item.asset_id,
  }));

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-10 px-6 py-16 text-white">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/40">
            Preferences
          </p>
          <h1 className="mt-2 text-3xl font-semibold">Emotional preferences</h1>
          <p className="mt-2 text-sm text-white/60">
            Tell the system which assets matter most to you.
          </p>
        </div>
        <Link
          className="rounded-2xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold"
          href={`/estates/${params.estateId}`}
        >
          Back to estate
        </Link>
      </header>

      {resolvedSearchParams?.error ? (
        <div className="rounded-2xl border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {resolvedSearchParams.error}
        </div>
      ) : null}

      <section className="grid gap-4">
        <h2 className="text-lg font-semibold">Scenarios & preferences</h2>
        <ScenarioBoard
          estateId={params.estateId}
          assets={assets ?? []}
          scenarioItems={boardItems}
          preferences={(preferences ?? []).map((pref) => ({
            assetId: pref.asset_id,
            emotionalScore: pref.emotional_score,
            note: pref.note,
          }))}
        />
      </section>

      {isAdmin ? (
        <section className="grid gap-4">
          <h2 className="text-lg font-semibold">Decedent preference boosts</h2>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <form className="grid gap-4" action={upsertBoost}>
              <input type="hidden" name="estate_id" value={params.estateId} />
              <label className="text-sm text-white/70">
                Asset
                <select
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-2 text-sm text-white"
                  name="asset_id"
                >
                  {(assets ?? []).map((asset) => (
                    <option key={asset.id} value={asset.id}>
                      {asset.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm text-white/70">
                Heir
                <select
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-2 text-sm text-white"
                  name="heir_id"
                >
                  {(members ?? [])
                    .filter((member) => member.user_id)
                    .map((member) => (
                      <option key={member.id} value={member.user_id ?? ""}>
                        {member.email} ({member.role})
                      </option>
                    ))}
                </select>
              </label>
              <label className="text-sm text-white/70">
                Boost (0-2)
                <input
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-2 text-sm text-white"
                  name="boost"
                  type="number"
                  min={0}
                  max={2}
                  defaultValue={0}
                />
              </label>
              <label className="text-sm text-white/70">
                Note
                <input
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-2 text-sm text-white"
                  name="note"
                />
              </label>
              <button
                className="w-fit rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-zinc-900"
                type="submit"
              >
                Save boost
              </button>
            </form>
          </div>

          <div className="grid gap-3">
            {(boosts ?? []).length ? (
              (boosts ?? []).map((boost) => (
                <div
                  className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm"
                  key={boost.id}
                >
                  <div>
                    <p className="font-semibold text-white">
                      {(assets ?? []).find((asset) => asset.id === boost.asset_id)
                        ?.name ?? "Asset"}
                    </p>
                    <p className="text-xs text-white/50">
                      {memberMap.get(boost.heir_id) ?? "Heir"}
                    </p>
                  </div>
                  <div className="text-xs font-semibold uppercase text-white/60">
                    Boost {boost.boost}
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 bg-black/30 px-4 py-6 text-sm text-white/50">
                No boosts yet.
              </div>
            )}
          </div>
        </section>
      ) : null}
    </div>
  );
}
