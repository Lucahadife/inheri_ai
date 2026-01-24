import Link from "next/link";

import { createClient } from "@/data/supabase/server";
import AiDocSummary from "@/ui/AiDocSummary";
import AiValueEstimate from "@/ui/AiValueEstimate";

import { createAsset } from "./actions";

type AssetsPageProps = {
  params: { estateId: string };
  searchParams?: { error?: string };
};

type AssetDocument = {
  id: string;
  storage_path: string;
  file_name: string;
  file_type: string | null;
  file_size: number | null;
};

type AssetRecord = {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  notes: string | null;
  value_low: number | null;
  value_high: number | null;
  asset_documents: AssetDocument[] | null;
};

export default async function AssetsPage({
  params,
  searchParams,
}: AssetsPageProps) {
  const supabase = createClient();

  const { data: assets } = await supabase
    .from("assets")
    .select(
      "id,name,description,location,notes,value_low,value_high,asset_documents(id,storage_path,file_name,file_type,file_size)"
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
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-8 px-6 py-12">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Assets
          </p>
          <h1 className="mt-2 text-3xl font-semibold">Estate assets</h1>
          <p className="mt-2 text-sm text-zinc-500">
            Track estate assets and upload supporting documents.
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

      <section className="grid gap-4 rounded-3xl border border-zinc-200 bg-white p-6">
        <h2 className="text-lg font-semibold">Add an asset</h2>
        <form className="grid gap-4" action={createAsset} encType="multipart/form-data">
          <input type="hidden" name="estate_id" value={params.estateId} />
          <label className="text-sm font-medium text-zinc-700">
            Asset name
            <input
              className="mt-2 w-full rounded-2xl border border-zinc-200 px-4 py-2 text-sm"
              name="name"
              required
            />
          </label>
          <label className="text-sm font-medium text-zinc-700">
            Description
            <textarea
              className="mt-2 w-full rounded-2xl border border-zinc-200 px-4 py-2 text-sm"
              name="description"
              rows={3}
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium text-zinc-700">
              Value low
              <input
                className="mt-2 w-full rounded-2xl border border-zinc-200 px-4 py-2 text-sm"
                name="value_low"
                type="number"
                min="0"
              />
            </label>
            <label className="text-sm font-medium text-zinc-700">
              Value high
              <input
                className="mt-2 w-full rounded-2xl border border-zinc-200 px-4 py-2 text-sm"
                name="value_high"
                type="number"
                min="0"
              />
            </label>
          </div>
          <label className="text-sm font-medium text-zinc-700">
            Location
            <input
              className="mt-2 w-full rounded-2xl border border-zinc-200 px-4 py-2 text-sm"
              name="location"
            />
          </label>
          <label className="text-sm font-medium text-zinc-700">
            Notes
            <textarea
              className="mt-2 w-full rounded-2xl border border-zinc-200 px-4 py-2 text-sm"
              name="notes"
              rows={2}
            />
          </label>
          <label className="text-sm font-medium text-zinc-700">
            Upload document
            <input
              className="mt-2 w-full rounded-2xl border border-zinc-200 px-4 py-2 text-sm"
              name="document"
              type="file"
            />
          </label>
          <button
            className="w-fit rounded-2xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white"
            type="submit"
          >
            Save asset
          </button>
        </form>
      </section>

      <section className="grid gap-4">
        <h2 className="text-lg font-semibold">Asset list</h2>
        <div className="grid gap-3">
          {(assets as AssetRecord[] | null)?.length ? (
            (assets as AssetRecord[]).map((asset) => (
              <div
                className="rounded-2xl border border-zinc-200 bg-white p-4"
                key={asset.id}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-base font-semibold text-zinc-900">
                      {asset.name}
                    </p>
                    <p className="text-sm text-zinc-500">
                      {asset.description || "No description"}
                    </p>
                  </div>
                  <div className="text-sm text-zinc-500">
                    {asset.value_low || asset.value_high
                      ? `$${asset.value_low ?? "—"} to $${asset.value_high ?? "—"}`
                      : "No valuation yet"}
                  </div>
                </div>
                {asset.location ? (
                  <p className="mt-3 text-sm text-zinc-500">
                    Location: {asset.location}
                  </p>
                ) : null}
                {asset.notes ? (
                  <p className="mt-2 text-sm text-zinc-500">
                    Notes: {asset.notes}
                  </p>
                ) : null}
                <div className="mt-4 grid gap-2 text-sm text-zinc-600">
                  {(asset.asset_documents ?? []).length ? (
                    (asset.asset_documents ?? []).map((doc) => (
                      <a
                        className="w-fit rounded-full border border-zinc-200 px-3 py-1 text-xs font-semibold uppercase text-zinc-500"
                        href={signedUrlMap.get(doc.id) || "#"}
                        key={doc.id}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {doc.file_name}
                      </a>
                    ))
                  ) : (
                    <span className="text-xs text-zinc-400">
                      No documents uploaded.
                    </span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-zinc-200 bg-white px-4 py-6 text-sm text-zinc-500">
              No assets yet.
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-6">
        <h2 className="text-lg font-semibold">AI helpers</h2>
        <div className="grid gap-6 lg:grid-cols-2">
          <AiValueEstimate />
          <AiDocSummary />
        </div>
      </section>
    </div>
  );
}
