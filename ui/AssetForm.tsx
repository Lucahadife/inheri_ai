"use client";

import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";

type AssetFormProps = {
  estateId: string;
  action: (formData: FormData) => void;
  disabled?: boolean;
};

type ValueEstimate = {
  low: number;
  high: number;
  factors: string[];
  confidence: number;
  disclaimer: string;
  explanation: string;
};

type DocSummary = {
  doc_type: string;
  what_it_proves: string;
  risks: string[];
  summary: string;
};

export default function AssetForm({
  estateId,
  action,
  disabled = false,
}: AssetFormProps) {
  const pathname = usePathname();
  const derivedEstateId = useMemo(() => {
    const match = pathname.match(/\/estates\/([^/]+)\/assets/);
    const value = match?.[1] ?? "";
    if (!value || value === "undefined" || value === "null") {
      return "";
    }
    return value;
  }, [pathname]);
  const finalEstateId = estateId || derivedEstateId;
  const [estimate, setEstimate] = useState<ValueEstimate | null>(null);
  const [docSummary, setDocSummary] = useState<DocSummary | null>(null);
  const [loadingEstimate, setLoadingEstimate] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [hasDoc, setHasDoc] = useState(false);
  const [approved, setApproved] = useState(false);
  const [docText, setDocText] = useState("");
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [estimateError, setEstimateError] = useState<string | null>(null);

  const handleEstimate = async () => {
    setLoadingEstimate(true);
    setEstimateError(null);
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
      doc_text: docText,
      doc_title: (document.getElementById("asset-doc-title") as HTMLInputElement)
        ?.value,
      doc_type: (document.getElementById("asset-doc-type") as HTMLInputElement)
        ?.value,
      doc_summary: docSummary?.summary ?? "",
    };
    if (!docText.trim()) {
      setEstimateError("Upload a document and extract text first.");
      setLoadingEstimate(false);
      return;
    }

    const response = await fetch("/api/ai/value-estimate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) {
      setEstimateError(data?.error ?? "AI estimate failed.");
    } else {
      setEstimate(data as ValueEstimate);
    }
    setLoadingEstimate(false);
  };

  const handleDocSummary = async () => {
    setLoadingSummary(true);
    const payload = {
      doc_text: docText,
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

  const handleDocUpload = async (file?: File | null) => {
    setHasDoc(Boolean(file));
    setOcrError(null);

    if (!file) return;
    if (!(file.type.startsWith("image/") || file.type === "application/pdf")) {
      setOcrError("OCR currently supports image or PDF uploads only.");
      return;
    }

    setOcrLoading(true);
    const buffer = await file.arrayBuffer();
    const base64 = btoa(
      String.fromCharCode(...new Uint8Array(buffer))
    );

    const response = await fetch("/api/ai/doc-ocr", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image: base64,
        mimeType: file.type,
      }),
    });
    const data = await response.json();

    if (data?.error) {
      setOcrError(data.error);
    } else {
      setDocText(data.text ?? "");
    }

    setOcrLoading(false);
  };

  return (
    <form className="grid gap-5" action={action}>
      <fieldset className="grid gap-5" disabled={disabled}>
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
        <input
          type="hidden"
          name="ai_explanation"
          value={estimate?.explanation ?? ""}
        />
        <input type="hidden" name="ai_approved" value={approved ? "1" : "0"} />
        <input
          type="hidden"
          name="ai_summary"
          value={docSummary?.summary ?? ""}
        />
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

      <div className="grid gap-4 rounded-3xl border border-white/10 bg-black/30 p-5">
        <h3 className="text-sm font-semibold text-white">
          Document intelligence
        </h3>
        <div className="grid gap-4 lg:grid-cols-2">
          <label className="text-sm text-white/70">
            Doc title
            <input
              id="asset-doc-title"
              className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-2 text-sm text-white"
              name="doc_title"
            />
          </label>
          <label className="text-sm text-white/70">
            Doc type
            <input
              id="asset-doc-type"
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
            onChange={(event) => handleDocUpload(event.target.files?.[0])}
          />
        </label>
        <label className="text-sm text-white/70">
          Paste doc text (for AI summary)
          <textarea
            id="asset-doc-text"
            className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-2 text-sm text-white"
            name="doc_text"
            rows={3}
            value={docText}
            onChange={(event) => setDocText(event.target.value)}
          />
        </label>
        <div className="text-xs text-white/50">
          {ocrLoading ? "Extracting text from the document..." : null}
          {!ocrLoading && ocrError ? ocrError : null}
        </div>
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

      <div className="grid gap-3 rounded-3xl border border-white/10 bg-black/30 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-white">
              AI valuation estimate
            </h3>
            <p className="text-xs text-white/60">
              Upload the document first, then generate an AI estimate using all
              inputs.
            </p>
          </div>
          <button
            className="rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-zinc-900 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={(event) => {
              event.preventDefault();
              handleEstimate();
            }}
            type="button"
            disabled={!hasDoc || loadingEstimate}
          >
            {loadingEstimate ? "Estimating..." : "Get AI estimate"}
          </button>
        </div>
        {estimateError ? (
          <div className="rounded-2xl border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-xs text-rose-100">
            {estimateError}
          </div>
        ) : null}
        {estimate ? (
          <div className="grid gap-2 text-xs text-white/70">
            <div>
              Range: ${estimate.low.toFixed(0)} - ${estimate.high.toFixed(0)} ·
              Confidence {(estimate.confidence * 100).toFixed(0)}%
            </div>
            <div>Factors: {estimate.factors.join(", ")}</div>
            <div>{estimate.explanation}</div>
            <div className="text-white/50">{estimate.disclaimer}</div>
            <label className="mt-2 flex items-center gap-2 text-xs text-white/70">
              <input
                type="checkbox"
                checked={approved}
                onChange={(event) => setApproved(event.target.checked)}
              />
              Approve this AI estimate
            </label>
          </div>
        ) : (
          <p className="text-xs text-white/50">
            Add your asset details and document text, then run the estimate.
          </p>
        )}
      </div>

        <button
          className="w-fit rounded-2xl bg-white px-6 py-2 text-sm font-semibold text-zinc-900 disabled:opacity-60"
          type="submit"
        >
          Save asset
        </button>
      </fieldset>
    </form>
  );
}
