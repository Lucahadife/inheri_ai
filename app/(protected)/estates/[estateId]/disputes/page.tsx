import Link from "next/link";

import { getRuleAcceptanceStatus } from "@/data/estate";
import { createClient } from "@/data/supabase/server";
import AiResolve from "@/ui/AiResolve";

export const dynamic = "force-dynamic";

type DisputesPageProps = {
  params: Promise<{ estateId: string }>;
};

export default async function DisputesPage({ params }: DisputesPageProps) {
  const resolvedParams = await params;
  const estateId = resolvedParams.estateId;
  const supabase = await createClient();

  const { data: assets } = await supabase
    .from("assets")
    .select("id,name")
    .eq("estate_id", estateId);

  const assetIds = (assets ?? []).map((asset) => asset.id);

  const { data: preferences } = assetIds.length
    ? await supabase
        .from("preferences")
        .select("asset_id,heir_id,emotional_score")
        .in("asset_id", assetIds)
    : { data: [] };

  const conflictAssets = (assets ?? []).filter((asset) => {
    const prefs = (preferences ?? [])
      .filter((pref) => pref.asset_id === asset.id)
      .map((pref) => pref.emotional_score)
      .sort((a, b) => b - a);
    return prefs.length >= 2 && prefs[0] >= 4 && prefs[1] >= 4;
  });

  const rulesStatus = await getRuleAcceptanceStatus(
    supabase as any,
    estateId
  );
  const rulesReady = rulesStatus.rulesAccepted;

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-10 px-6 py-16 text-white">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/40">
            Disputes
          </p>
          <h1 className="mt-2 text-3xl font-semibold">
            AI‑mediated resolutions
          </h1>
          <p className="mt-2 text-sm text-white/60">
            Explore potential conflicts and let AI propose compromise paths.
          </p>
        </div>
        <Link
          className="rounded-2xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold"
          href={`/estates/${estateId}`}
        >
          Back to estate
        </Link>
      </header>

      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        {!rulesReady ? (
          <div className="rounded-2xl border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            Resolve rule acceptance before final dispute mediation.
          </div>
        ) : null}
        <h2 className="text-lg font-semibold">Likely conflicts</h2>
        <div className="mt-4 grid gap-3">
          {conflictAssets.length ? (
            conflictAssets.map((asset) => (
              <div
                className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/70"
                key={asset.id}
              >
                Multiple heirs rated {asset.name} highly.
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-white/10 bg-black/30 px-4 py-6 text-sm text-white/50">
              No obvious conflicts yet.
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-4">
        <h2 className="text-lg font-semibold">AI dispute assistant</h2>
        <AiResolve />
      </section>
    </div>
  );
}
