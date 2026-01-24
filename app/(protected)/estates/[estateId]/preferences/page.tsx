import Link from "next/link";

import { createClient } from "@/data/supabase/server";

import { upsertBoost, upsertPreference } from "./actions";

type PreferencesPageProps = {
  params: { estateId: string };
  searchParams?: { error?: string };
};

export default async function PreferencesPage({
  params,
  searchParams,
}: PreferencesPageProps) {
  const supabase = createClient();
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
    .select("id,name,description")
    .eq("estate_id", params.estateId)
    .order("created_at", { ascending: false });

  const { data: preferences } = await supabase
    .from("preferences")
    .select("asset_id,emotional_score,note")
    .eq("heir_id", user?.id ?? "");

  const preferenceMap = new Map(
    (preferences ?? []).map((pref) => [pref.asset_id, pref])
  );

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

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-8 px-6 py-12">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Preferences
          </p>
          <h1 className="mt-2 text-3xl font-semibold">Emotional preferences</h1>
          <p className="mt-2 text-sm text-zinc-500">
            Tell the system which assets matter most to you.
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

      <section className="grid gap-4">
        <h2 className="text-lg font-semibold">Your preferences</h2>
        <div className="grid gap-3">
          {assets?.length ? (
            assets.map((asset) => {
              const pref = preferenceMap.get(asset.id);
              return (
                <form
                  className="grid gap-3 rounded-2xl border border-zinc-200 bg-white p-4"
                  action={upsertPreference}
                  key={asset.id}
                >
                  <input type="hidden" name="estate_id" value={params.estateId} />
                  <input type="hidden" name="asset_id" value={asset.id} />
                  <div>
                    <p className="text-sm font-semibold text-zinc-900">
                      {asset.name}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {asset.description || "No description"}
                    </p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="text-sm font-medium text-zinc-700">
                      Emotional score (0-5)
                      <input
                        className="mt-2 w-full rounded-2xl border border-zinc-200 px-4 py-2 text-sm"
                        name="score"
                        type="number"
                        min={0}
                        max={5}
                        defaultValue={pref?.emotional_score ?? 0}
                      />
                    </label>
                    <label className="text-sm font-medium text-zinc-700">
                      Note
                      <input
                        className="mt-2 w-full rounded-2xl border border-zinc-200 px-4 py-2 text-sm"
                        name="note"
                        defaultValue={pref?.note ?? ""}
                      />
                    </label>
                  </div>
                  <button
                    className="w-fit rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800"
                    type="submit"
                  >
                    Save preference
                  </button>
                </form>
              );
            })
          ) : (
            <div className="rounded-2xl border border-dashed border-zinc-200 bg-white px-4 py-6 text-sm text-zinc-500">
              No assets yet.
            </div>
          )}
        </div>
      </section>

      {isAdmin ? (
        <section className="grid gap-4">
          <h2 className="text-lg font-semibold">Decedent preference boosts</h2>
          <div className="rounded-3xl border border-zinc-200 bg-white p-6">
            <form className="grid gap-4" action={upsertBoost}>
              <input type="hidden" name="estate_id" value={params.estateId} />
              <label className="text-sm font-medium text-zinc-700">
                Asset
                <select
                  className="mt-2 w-full rounded-2xl border border-zinc-200 px-4 py-2 text-sm"
                  name="asset_id"
                >
                  {(assets ?? []).map((asset) => (
                    <option key={asset.id} value={asset.id}>
                      {asset.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-medium text-zinc-700">
                Heir
                <select
                  className="mt-2 w-full rounded-2xl border border-zinc-200 px-4 py-2 text-sm"
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
              <label className="text-sm font-medium text-zinc-700">
                Boost (0-2)
                <input
                  className="mt-2 w-full rounded-2xl border border-zinc-200 px-4 py-2 text-sm"
                  name="boost"
                  type="number"
                  min={0}
                  max={2}
                  defaultValue={0}
                />
              </label>
              <label className="text-sm font-medium text-zinc-700">
                Note
                <input
                  className="mt-2 w-full rounded-2xl border border-zinc-200 px-4 py-2 text-sm"
                  name="note"
                />
              </label>
              <button
                className="w-fit rounded-2xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white"
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
                  className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm"
                  key={boost.id}
                >
                  <div>
                    <p className="font-semibold text-zinc-900">
                      {(assets ?? []).find((asset) => asset.id === boost.asset_id)
                        ?.name ?? "Asset"}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {memberMap.get(boost.heir_id) ?? "Heir"}
                    </p>
                  </div>
                  <div className="text-xs font-semibold uppercase text-zinc-500">
                    Boost {boost.boost}
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-zinc-200 bg-white px-4 py-6 text-sm text-zinc-500">
                No boosts yet.
              </div>
            )}
          </div>
        </section>
      ) : null}
    </div>
  );
}
