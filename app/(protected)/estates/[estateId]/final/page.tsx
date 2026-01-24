import Link from "next/link";

import { createClient } from "@/data/supabase/server";

type FinalPageProps = {
  params: { estateId: string };
};

const checklistByType: Record<string, string[]> = {
  "real estate": ["Deed", "Property tax statement", "Insurance policy"],
  vehicle: ["Title", "Registration", "Bill of sale"],
  jewelry: ["Appraisal", "Insurance schedule", "Purchase receipt"],
  default: ["Proof of ownership", "Supporting documentation"],
};

export default async function FinalPage({ params }: FinalPageProps) {
  const supabase = await createClient();

  const { data: assets } = await supabase
    .from("assets")
    .select("id,name,asset_type,asset_category")
    .eq("estate_id", params.estateId);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-10 px-6 py-16 text-white">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/40">
            Finalization
          </p>
          <h1 className="mt-2 text-3xl font-semibold">
            Documents & checklist
          </h1>
          <p className="mt-2 text-sm text-white/60">
            Prepare the paperwork needed to finalize the allocation.
          </p>
        </div>
        <Link
          className="rounded-2xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold"
          href={`/estates/${params.estateId}`}
        >
          Back to estate
        </Link>
      </header>

      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-lg font-semibold">Required documents</h2>
        <div className="mt-4 grid gap-4">
          {(assets ?? []).length ? (
            assets?.map((asset) => {
              const type =
                asset.asset_type?.toLowerCase() ||
                asset.asset_category?.toLowerCase() ||
                "default";
              const checklist = checklistByType[type] ?? checklistByType.default;
              return (
                <div
                  className="rounded-2xl border border-white/10 bg-black/30 px-4 py-4"
                  key={asset.id}
                >
                  <p className="text-sm font-semibold text-white">
                    {asset.name}
                  </p>
                  <ul className="mt-3 list-disc pl-5 text-xs text-white/60">
                    {checklist.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              );
            })
          ) : (
            <div className="rounded-2xl border border-dashed border-white/10 bg-black/30 px-4 py-6 text-sm text-white/50">
              No assets found.
            </div>
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-lg font-semibold">Exportable summary</h2>
        <p className="mt-2 text-sm text-white/60">
          A printable summary will be available after final allocations are
          approved.
        </p>
        <button className="mt-4 rounded-2xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white">
          Export summary (coming soon)
        </button>
      </section>
    </div>
  );
}
