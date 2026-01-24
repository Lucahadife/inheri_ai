"use client";

import { useState } from "react";

type Swap = {
  give_asset: string;
  receive_asset: string;
  from_heir: string;
  to_heir: string;
  rationale: string;
};

type Result =
  | {
      suggested_swaps: Swap[];
      overall_rationale: string;
    }
  | { error: string };

export default function AiResolve() {
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setResult(null);

    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());

    const response = await fetch("/api/ai/resolve", {
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
      <h3 className="text-lg font-semibold">AI dispute resolution</h3>
      <p className="mt-2 text-sm text-zinc-500">
        Describe a conflict and provide allocation context.
      </p>
      <form className="mt-4 grid gap-3" onSubmit={handleSubmit}>
        <textarea
          className="rounded-2xl border border-zinc-200 px-4 py-2 text-sm"
          name="conflict"
          placeholder="Conflict description"
          rows={3}
          required
        />
        <textarea
          className="rounded-2xl border border-zinc-200 px-4 py-2 text-sm"
          name="allocation"
          placeholder="Current allocation context"
          rows={3}
          required
        />
        <textarea
          className="rounded-2xl border border-zinc-200 px-4 py-2 text-sm"
          name="preferences"
          placeholder="Preferences context"
          rows={3}
          required
        />
        <button
          className="w-fit rounded-2xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white"
          type="submit"
          disabled={loading}
        >
          {loading ? "Resolving..." : "Suggest swaps"}
        </button>
      </form>
      {result ? (
        <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700">
          {"error" in result ? (
            result.error
          ) : (
            <div className="grid gap-2">
              <div className="font-semibold">Overall rationale</div>
              <div>{result.overall_rationale}</div>
              <div className="font-semibold">Suggested swaps</div>
              <ul className="list-disc pl-5">
                {result.suggested_swaps.map((swap, index) => (
                  <li key={`${swap.give_asset}-${index}`}>
                    {swap.from_heir} gives {swap.give_asset} to {swap.to_heir} for{" "}
                    {swap.receive_asset}. {swap.rationale}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
