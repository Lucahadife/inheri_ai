"use client";

import { useMemo, useState } from "react";

type Asset = {
  id: string;
  name: string;
  description: string | null;
  value_low: number | null;
  value_high: number | null;
  ai_value_low: number | null;
  ai_value_high: number | null;
  imageUrl?: string | null;
};

type ScenarioItem = {
  scenario: string;
  assetId: string;
};

type Preference = {
  assetId: string;
  emotionalScore: number;
  note: string | null;
};

type ScenarioBoardProps = {
  estateId: string;
  assets: Asset[];
  scenarioItems: ScenarioItem[];
  preferences: Preference[];
  disabled?: boolean;
};

const scenarios = ["A", "B", "C"] as const;

const estimateMid = (asset: Asset) => {
  const low = asset.ai_value_low ?? asset.value_low ?? 0;
  const high = asset.ai_value_high ?? asset.value_high ?? low;
  return (low + high) / 2;
};

export default function ScenarioBoard({
  estateId,
  assets,
  scenarioItems,
  preferences,
  disabled = false,
}: ScenarioBoardProps) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [prefs, setPrefs] = useState(() => {
    const map = new Map<string, Preference>();
    preferences.forEach((pref) => map.set(pref.assetId, pref));
    return map;
  });
  const [items, setItems] = useState<ScenarioItem[]>(scenarioItems);

  const assetsByScenario = useMemo(() => {
    const map = new Map<string, Asset[]>();
    scenarios.forEach((scenario) => map.set(scenario, []));
    items.forEach((item) => {
      const asset = assets.find((asset) => asset.id === item.assetId);
      if (!asset) return;
      map.get(item.scenario)?.push(asset);
    });
    return map;
  }, [assets, items]);

  const handleDrop = async (scenario: string) => {
    if (disabled) return;
    if (!draggingId) return;
    const payload = {
      estateId,
      assetId: draggingId,
      scenarioName: scenario,
      action: "add",
    };
    await fetch("/api/scenarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setItems((prev) => {
      if (prev.some((item) => item.assetId === draggingId && item.scenario === scenario)) {
        return prev;
      }
      return [...prev, { scenario, assetId: draggingId }];
    });
    setDraggingId(null);
  };

  const handleRemove = async (scenario: string, assetId: string) => {
    if (disabled) return;
    await fetch("/api/scenarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        estateId,
        assetId,
        scenarioName: scenario,
        action: "remove",
      }),
    });
    setItems((prev) =>
      prev.filter((item) => !(item.assetId === assetId && item.scenario === scenario))
    );
  };

  const handleSavePreference = async (assetId: string) => {
    if (disabled) return;
    const current = prefs.get(assetId);
    await fetch("/api/preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        assetId,
        score: current?.emotionalScore ?? 0,
        note: current?.note ?? "",
      }),
    });
  };

  return (
    <div className="grid gap-8">
      <div className="grid gap-4 lg:grid-cols-[1.2fr_1.8fr]">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-semibold text-white">Assets</h2>
          <p className="mt-2 text-sm text-white/60">
            Drag assets into a scenario and set emotional scores.
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {assets.map((asset) => {
              const pref = prefs.get(asset.id) ?? {
                assetId: asset.id,
                emotionalScore: 0,
                note: "",
              };
              return (
                <div
                  className="rounded-2xl border border-white/10 bg-black/30 p-4"
                  key={asset.id}
                  draggable={!disabled}
                  onDragStart={() => setDraggingId(asset.id)}
                  onDragEnd={() => setDraggingId(null)}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {asset.name}
                      </p>
                      {asset.description ? (
                        <p className="mt-1 text-xs text-white/50">
                          {asset.description}
                        </p>
                      ) : null}
                      <p className="text-xs text-white/50">
                        Midpoint ${estimateMid(asset).toFixed(0)}
                      </p>
                    </div>
                    <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/60">
                      Drag
                    </span>
                  </div>
                  {asset.imageUrl ? (
                    <div className="mt-3 overflow-hidden rounded-2xl border border-white/10">
                      <img
                        alt={`${asset.name} document preview`}
                        className="h-32 w-full object-cover"
                        src={asset.imageUrl}
                      />
                    </div>
                  ) : null}
                  <div className="mt-3 grid gap-3">
                    <label className="text-xs text-white/60">
                      Emotional score: {pref.emotionalScore}
                      <input
                        className="mt-2 w-full"
                        type="range"
                        min={0}
                        max={5}
                        value={pref.emotionalScore}
                        disabled={disabled}
                        onChange={(event) =>
                          setPrefs((prev) => {
                            const next = new Map(prev);
                            next.set(asset.id, {
                              ...pref,
                              emotionalScore: Number(event.target.value),
                            });
                            return next;
                          })
                        }
                      />
                    </label>
                    <input
                      className="rounded-2xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-white"
                      placeholder="Preference note"
                      value={pref.note ?? ""}
                      disabled={disabled}
                      onChange={(event) =>
                        setPrefs((prev) => {
                          const next = new Map(prev);
                          next.set(asset.id, {
                            ...pref,
                            note: event.target.value,
                          });
                          return next;
                        })
                      }
                    />
                    <button
                      className="w-fit rounded-full border border-white/15 px-3 py-1 text-xs text-white/70"
                      onClick={() => handleSavePreference(asset.id)}
                      type="button"
                      disabled={disabled}
                    >
                      Save preference
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          {scenarios.map((scenario) => (
            <div
              className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-white/5 p-4"
              key={scenario}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => handleDrop(scenario)}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">
                  Scenario {scenario}
                </h3>
                <span className="text-xs text-white/50">
                  {assetsByScenario.get(scenario)?.length ?? 0} assets
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {(assetsByScenario.get(scenario) ?? []).map((asset) => (
                  <div
                    className="flex items-center justify-between gap-2 rounded-2xl border border-white/10 bg-black/30 px-3 py-2 text-xs text-white/70"
                    key={asset.id}
                  >
                    <span>{asset.name}</span>
                    <button
                      className="text-xs text-white/50 hover:text-white"
                      onClick={() => handleRemove(scenario, asset.id)}
                      type="button"
                      disabled={disabled}
                    >
                      Remove
                    </button>
                  </div>
                ))}
                {!assetsByScenario.get(scenario)?.length ? (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-black/30 px-3 py-6 text-center text-xs text-white/50">
                    Drag assets here
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
