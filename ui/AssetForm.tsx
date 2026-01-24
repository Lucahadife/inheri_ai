"use client";

import { useState } from "react";

type AssetFormProps = {
  estateId: string;
  action: (formData: FormData) => void;
};

type ValueEstimate = {
  low: number;
  high: number;
  factors: string[];
  confidence: number;
  disclaimer: string;
};

type DocSummary = {
  doc_type: string;
  what_it_proves: string;
  risks: string[];
  summary: string;
};

export default function AssetForm({ estateId, action }: AssetFormProps) {
  const [estimate, setEstimate] = useState<ValueEstimate | null>(null);
  const [docSummary, setDocSummary] = useState<DocSummary | null>(null);
  const [loadingEstimate, setLoadingEstimate] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(false);

  const handleEstimate = async () => {
    setLoadingEstimate(true);
    const payload = {
      name: (document.getElementById("asset-name") as HTMLInputElement)?.value,
      description: (
        document.getElementById("asset-description") as HTMLTextAreaElement
      )?.value,
      location: (
        document.getElementById("asset-location") as HTMLInputElement
      )?.value,
      notes: (document.getElementById("asset-notes") as HTMLTextAreaElement)
        ?.value,
      doc_text: (document.getElementById("asset-doc-text") as HTMLTextAreaElement)
        ?.value,
    };
    const response = await fetch("/api/ai/value-estimate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await response.json()) as ValueEstimate;
    setEstimate(data);
    setLoadingEstimate(false);
  };

  const handleDocSummary = async () => {
    setLoadingSummary(true);
    const payload = {
      doc_text: (document.getElementById("asset-doc-text") as HTMLTextAreaElement)
        ?.value,
    };
    const response = await fetch("/api/ai/doc-summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await response.json()) as DocSummary;
    setDocSummary(data);
    setLoadingSummary(false);
  };

  return (
    <form className="grid gap-5" action={action} encType="multipart/form-data">
      <input type="hidden" name="estate_id" value={estateId} />
      <input type="hidden" name="ai_value_low" value={estimate?.low ?? ""} />
      <input type="hidden" name="ai_value_high" value={estimate?.high ?? ""} />
      <input
        type="hidden"
        name="ai_confidence"
        value={estimate?.confidence ?? ""}
      />
      <input
        type="hidden"
        name="ai_factors"
        value={estimate?.factors?.join("|") ?? ""}
      />
      <input
        type="hidden"
        name="ai_disclaimer"
        value={estimate?.disclaimer ?? ""}
      />
      <input type="hidden" name="ai_summary" value={docSummary?.summary ?? ""} />
      <input
        type="hidden"
        name="doc_type_ai"
        value={docSummary?.doc_type ?? ""}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <label className="text-sm text-white/70">
          Asset name
          <input
            id="asset-name"
            className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-2 text-sm text-white"
            name="name"
            required
          />
        </label>
        <label className="text-sm text-white/70">
          Asset type
          <input
            className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-2 text-sm text-white"
            name="asset_type"
            placeholder="Real estate, vehicle, art..."
          />
        </label>
        <label className="text-sm text-white/70">
          Category
          <input
            className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-2 text-sm text-white"
            name="asset_category"
            placeholder="Property, collectibles, cash"
          />
        </label>
        <label className="text-sm text-white/70">
          Size
          <input
            className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-2 text-sm text-white"
            name="size_label"
            placeholder="Sq ft, acreage, or dimensions"
          />
        </label>
      </div>

      <label className="text-sm text-white/70">
        Description
        <textarea
          id="asset-description"
          className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-2 text-sm text-white"
          name="description"
          rows={3}
        />
      </label>

      <div className="grid gap-4 lg:grid-cols-2">
        <label className="text-sm text-white/70">
          Value low
          <input
            className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-2 text-sm text-white"
            name="value_low"
            type="number"
            min="0"
          />
        </label>
        <label className="text-sm text-white/70">
          Value high
          <input
            className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-2 text-sm text-white"
            name="value_high"
            type="number"
            min="0"
          />
        </label>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <label className="text-sm text-white/70">
          Location
          <input
            id="asset-location"
            className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-2 text-sm text-white"
            name="location"
          />
        </label>
        <label className="text-sm text-white/70">
          Notes
          <textarea
            id="asset-notes"
            className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-2 text-sm text-white"
            name="notes"
            rows={2}
          />
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          className="rounded-2xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white"
          onClick={(event) => {
            event.preventDefault();
            handleEstimate();
          }}
          type="button"
        >
          {loadingEstimate ? "Estimating..." : "Get AI estimate"}
        </button>
        {estimate ? (
          <div className="text-xs text-white/60">
            AI range ${estimate.low.toFixed(0)} - ${estimate.high.toFixed(0)} ·
            {(estimate.confidence * 100).toFixed(0)}% confidence
          </div>
        ) : null}
      </div>

      <div className="grid gap-4 rounded-3xl border border-white/10 bg-black/30 p-5">
        <h3 className="text-sm font-semibold text-white">
          Document intelligence
        </h3>
        <div className="grid gap-4 lg:grid-cols-2">
          <label className="text-sm text-white/70">
            Doc title
            <input
              className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-2 text-sm text-white"
              name="doc_title"
            />
          </label>
          <label className="text-sm text-white/70">
            Doc type
            <input
              className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-2 text-sm text-white"
              name="doc_type"
              placeholder="Appraisal, deed, receipt"
            />
          </label>
        </div>
        <label className="text-sm text-white/70">
          Upload doc photo
          <input
            className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-2 text-sm text-white"
            name="document"
            type="file"
            accept="image/*,.pdf"
          />
        </label>
        <label className="text-sm text-white/70">
          Paste doc text (for AI summary)
          <textarea
            id="asset-doc-text"
            className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-2 text-sm text-white"
            name="doc_text"
            rows={3}
          />
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <button
            className="rounded-2xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white"
            onClick={(event) => {
              event.preventDefault();
              handleDocSummary();
            }}
            type="button"
          >
            {loadingSummary ? "Summarizing..." : "AI doc summary"}
          </button>
          {docSummary ? (
            <div className="text-xs text-white/60">
              {docSummary.doc_type} · {docSummary.summary}
            </div>
          ) : null}
        </div>
      </div>

      <button
        className="w-fit rounded-2xl bg-white px-6 py-2 text-sm font-semibold text-zinc-900"
        type="submit"
      >
        Save asset
      </button>
    </form>
  );
}
