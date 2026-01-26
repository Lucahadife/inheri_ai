import Link from "next/link";

import { createClient } from "@/data/supabase/server";
import AssetForm from "@/ui/AssetForm";

import { createAsset } from "./actions";

type AssetsPageProps = {
  params: { estateId: string };
  searchParams?: { error?: string } | Promise<{ error?: string }>;
};

type AssetDocument = {
  id: string;
  storage_path: string;
  file_name: string;
  file_type: string | null;
  file_size: number | null;
  title?: string | null;
  doc_type?: string | null;
  summary?: string | null;
  ai_summary?: string | null;
};

type AssetRecord = {
  id: string;
  name: string;
  asset_type: string | null;
  asset_category: string | null;
  size_label: string | null;
  description: string | null;
  location: string | null;
  notes: string | null;
  value_low: number | null;
  value_high: number | null;
  ai_value_low: number | null;
  ai_value_high: number | null;
  ai_confidence: number | null;
  ai_factors: string[] | null;
  ai_explanation?: string | null;
  ai_approved?: boolean | null;
  asset_documents: AssetDocument[] | null;
};

export default async function AssetsPage({
  params,
  searchParams,
}: AssetsPageProps) {
  const resolvedSearchParams = await Promise.resolve(searchParams);
  const supabase = await createClient();

  const { data: assets } = await supabase
    .from("assets")
    .select(
      "id,name,asset_type,asset_category,size_label,description,location,notes,value_low,value_high,ai_value_low,ai_value_high,ai_confidence,ai_factors,ai_explanation,ai_approved,asset_documents(id,storage_path,file_name,file_type,file_size,title,doc_type,summary,ai_summary)"
    )
    .eq("estate_id", params.estateId)
    .order("created_at", { ascending: false });

  const documents = (assets ?? [])
    .flatMap((asset) => asset.asset_documents ?? [])
    .filter(Boolean) as AssetDocument[];

  const signedUrlEntries = await Promise.all(
    documents.map(async (doc) => {
      const { data } = await supabase.storage
        .from("asset-docs")
        .createSignedUrl(doc.storage_path, 60 * 60);
      return [doc.id, data?.signedUrl ?? ""] as const;
    })
  );

  const signedUrlMap = new Map(signedUrlEntries);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-10 px-6 py-16 text-white">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/40">
            Assets
          </p>
          <h1 className="mt-2 text-3xl font-semibold">Estate assets</h1>
          <p className="mt-2 text-sm text-white/60">
            Track estate assets and upload supporting documents.
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

      <section className="grid gap-4 rounded-3xl border border-white/10 bg-white/5 p-8">
        <h2 className="text-lg font-semibold">Add an asset</h2>
        <AssetForm
          estateId={params.estateId}
          action={createAsset.bind(null, params.estateId)}
        />
      </section>

      <section className="grid gap-4">
        <h2 className="text-lg font-semibold">Asset list</h2>
        <div className="grid gap-4">
          {(assets as AssetRecord[] | null)?.length ? (
            (assets as AssetRecord[]).map((asset) => (
              <div
                className="rounded-3xl border border-white/10 bg-black/30 p-5"
                key={asset.id}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-base font-semibold text-white">
                      {asset.name}
                    </p>
                    <p className="text-sm text-white/60">
                      {asset.description || "No description"}
                    </p>
                  </div>
                  <div className="text-sm text-white/70">
                    {asset.ai_value_low || asset.ai_value_high ? (
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase ${
                          asset.ai_approved
                            ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-200"
                            : "border-amber-400/40 bg-amber-500/10 text-amber-200"
                        }`}
                      >
                        {asset.ai_approved ? "AI approved" : "AI pending"}
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-white/60">
                  {asset.asset_type ? (
                    <span className="rounded-full border border-white/10 px-3 py-1">
                      {asset.asset_type}
                    </span>
                  ) : null}
                  {asset.asset_category ? (
                    <span className="rounded-full border border-white/10 px-3 py-1">
                      {asset.asset_category}
                    </span>
                  ) : null}
                  {asset.size_label ? (
                    <span className="rounded-full border border-white/10 px-3 py-1">
                      {asset.size_label}
                    </span>
                  ) : null}
                </div>
                <div className="mt-4 text-sm text-white/70">
                  {asset.ai_value_low || asset.ai_value_high
                    ? `$${asset.ai_value_low ?? "—"} to $${asset.ai_value_high ?? "—"} · Confidence ${(asset.ai_confidence ?? 0) * 100}%`
                    : asset.value_low || asset.value_high
                      ? `$${asset.value_low ?? "—"} to $${asset.value_high ?? "—"}`
                      : "No valuation yet"}
                </div>
                {asset.ai_explanation ? (
                  <p className="mt-2 text-xs text-white/60">
                    {asset.ai_explanation}
                  </p>
                ) : null}
                {asset.location ? (
                  <p className="mt-3 text-sm text-white/60">
                    Location: {asset.location}
                  </p>
                ) : null}
                {asset.notes ? (
                  <p className="mt-2 text-sm text-white/60">
                    Notes: {asset.notes}
                  </p>
                ) : null}
                <div className="mt-4 grid gap-2 text-sm text-white/70">
                  {(asset.asset_documents ?? []).length ? (
                    (asset.asset_documents ?? []).map((doc) => (
                      <div
                        className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/30 px-3 py-2"
                        key={doc.id}
                      >
                        <div>
                          <p className="text-xs font-semibold text-white">
                            {doc.title || doc.file_name}
                          </p>
                          <p className="text-xs text-white/50">
                            {doc.doc_type || "Document"}
                          </p>
                          {doc.ai_summary || doc.summary ? (
                            <p className="mt-1 text-xs text-white/60">
                              {(doc.ai_summary || doc.summary) as string}
                            </p>
                          ) : null}
                        </div>
                        <div className="flex items-center gap-2">
                          <a
                            className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase text-white/70"
                            href={signedUrlMap.get(doc.id) || "#"}
                            target="_blank"
                            rel="noreferrer"
                          >
                            View
                          </a>
                        </div>
                      </div>
                    ))
                  ) : (
                    <span className="text-xs text-white/50">
                      No documents uploaded.
                    </span>
                  )}
                </div>
                <div className="mt-4 flex flex-wrap gap-2 text-xs text-white/60">
                  {!asset.value_low && !asset.value_high && !asset.ai_value_low ? (
                    <span className="rounded-full border border-rose-400/30 bg-rose-500/10 px-3 py-1 text-rose-100">
                      Missing valuation
                    </span>
                  ) : null}
                  {!asset.asset_documents?.length ? (
                    <span className="rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1 text-amber-100">
                      Missing documents
                    </span>
                  ) : null}
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-white/10 bg-black/30 px-4 py-6 text-sm text-white/50">
              No assets yet.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
