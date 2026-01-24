"use client";

import { useState } from "react";

type Result =
  | {
      acceptance_probability: number;
      summary: string;
      key_drivers: string[];
    }
  | { error: string };

type AiFairnessProps = {
  allocationSummary: string;
  preferenceSummary: string;
  rulesSummary: string;
};

export default function AiFairness({
  allocationSummary,
  preferenceSummary,
  rulesSummary,
}: AiFairnessProps) {
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    const response = await fetch("/api/ai/fairness", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        allocation: allocationSummary,
        preferences: preferenceSummary,
        rules: rulesSummary,
      }),
    });
    const data = await response.json();
    setResult(data);
    setLoading(false);
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <h3 className="text-lg font-semibold text-white">AI fairness score</h3>
      <p className="mt-2 text-sm text-white/60">
        Uses rules, preferences, and allocations to estimate acceptance.
      </p>
      <button
        className="mt-4 rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-zinc-900"
        onClick={handleSubmit}
        type="button"
      >
        {loading ? "Evaluating..." : "Evaluate acceptance"}
      </button>
      {result ? (
        <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/70">
          {"error" in result ? (
            result.error
          ) : (
            <div className="grid gap-2">
              <div>
                Acceptance probability:{" "}
                {(result.acceptance_probability * 100).toFixed(0)}%
              </div>
              <div>{result.summary}</div>
              <div className="text-xs text-white/50">
                Drivers: {result.key_drivers.join(", ")}
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
