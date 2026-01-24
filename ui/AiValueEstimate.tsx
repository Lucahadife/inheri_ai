"use client";

import { useState } from "react";

type Result =
  | {
      low: number;
      high: number;
      factors: string[];
      confidence: number;
      disclaimer: string;
    }
  | { error: string };

export default function AiValueEstimate() {
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setResult(null);

    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());

    const response = await fetch("/api/ai/value-estimate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    setResult(data);
    setLoading(false);
  };

  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-6">
      <h3 className="text-lg font-semibold">AI value estimate</h3>
      <p className="mt-2 text-sm text-zinc-500">
        Provide asset context to receive a value range and factors.
      </p>
      <form className="mt-4 grid gap-3" onSubmit={handleSubmit}>
        <input
          className="rounded-2xl border border-zinc-200 px-4 py-2 text-sm"
          name="name"
          placeholder="Asset name"
          required
        />
        <textarea
          className="rounded-2xl border border-zinc-200 px-4 py-2 text-sm"
          name="description"
          placeholder="Description"
          rows={3}
        />
        <input
          className="rounded-2xl border border-zinc-200 px-4 py-2 text-sm"
          name="location"
          placeholder="Location"
        />
        <textarea
          className="rounded-2xl border border-zinc-200 px-4 py-2 text-sm"
          name="notes"
          placeholder="Notes or condition"
          rows={2}
        />
        <textarea
          className="rounded-2xl border border-zinc-200 px-4 py-2 text-sm"
          name="doc_text"
          placeholder="Optional document text"
          rows={3}
        />
        <button
          className="w-fit rounded-2xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white"
          type="submit"
          disabled={loading}
        >
          {loading ? "Estimating..." : "Run estimate"}
        </button>
      </form>
      {result ? (
        <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700">
          {"error" in result ? (
            result.error
          ) : (
            <div className="grid gap-2">
              <div>
                Range: ${result.low.toFixed(0)} - $
                {result.high.toFixed(0)}
              </div>
              <div>Confidence: {(result.confidence * 100).toFixed(0)}%</div>
              <div>Factors: {result.factors.join(", ")}</div>
              <div className="text-xs text-zinc-500">{result.disclaimer}</div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
