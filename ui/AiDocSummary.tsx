"use client";

import { useState } from "react";

type Result =
  | {
      doc_type: string;
      what_it_proves: string;
      risks: string[];
      summary: string;
    }
  | { error: string };

export default function AiDocSummary() {
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setResult(null);

    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());

    const response = await fetch("/api/ai/doc-summary", {
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
      <h3 className="text-lg font-semibold">AI document summary</h3>
      <p className="mt-2 text-sm text-zinc-500">
        Paste extracted text to generate a summary and risk notes.
      </p>
      <form className="mt-4 grid gap-3" onSubmit={handleSubmit}>
        <textarea
          className="rounded-2xl border border-zinc-200 px-4 py-2 text-sm"
          name="doc_text"
          placeholder="Paste document text"
          rows={5}
          required
        />
        <button
          className="w-fit rounded-2xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white"
          type="submit"
          disabled={loading}
        >
          {loading ? "Summarizing..." : "Summarize"}
        </button>
      </form>
      {result ? (
        <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700">
          {"error" in result ? (
            result.error
          ) : (
            <div className="grid gap-2">
              <div>Type: {result.doc_type}</div>
              <div>What it proves: {result.what_it_proves}</div>
              <div>Risks: {result.risks.join(", ") || "None noted"}</div>
              <div>Summary: {result.summary}</div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
