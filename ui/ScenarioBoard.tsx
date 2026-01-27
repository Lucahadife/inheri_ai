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
  const [dragOverScenario, setDragOverScenario] = useState<string | null>(null);
  const [prefs, setPrefs] = useState(() => {
    const map = new Map<string, Preference>();
    preferences.forEach((pref) => map.set(pref.assetId, pref));
    return map;
  });
  const [items, setItems] = useState<ScenarioItem[]>(scenarioItems);
  const [saving, setSaving] = useState<string | null>(null);

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

  const handleDragStart = (assetId: string, event: React.DragEvent) => {
    if (disabled) return;
    setDraggingId(assetId);
    // Set drag image and data
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", assetId);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setDragOverScenario(null);
  };

  const handleDragOver = (scenario: string, event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setDragOverScenario(scenario);
  };

  const handleDragLeave = () => {
    setDragOverScenario(null);
  };

  const handleDrop = async (scenario: string, event: React.DragEvent) => {
    event.preventDefault();
    setDragOverScenario(null);
    
    if (disabled) return;
    const assetId = draggingId || event.dataTransfer.getData("text/plain");
    if (!assetId) return;

    // Optimistic update
    setItems((prev) => {
      if (prev.some((item) => item.assetId === assetId && item.scenario === scenario)) {
        return prev;
      }
      return [...prev, { scenario, assetId }];
    });

    // Persist to server
    await fetch("/api/scenarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        estateId,
        assetId,
        scenarioName: scenario,
        action: "add",
      }),
    });

    setDraggingId(null);
  };

  const handleRemove = async (scenario: string, assetId: string) => {
    if (disabled) return;
    
    // Optimistic update
    setItems((prev) =>
      prev.filter((item) => !(item.assetId === assetId && item.scenario === scenario))
    );

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
  };

  const handleSavePreference = async (assetId: string) => {
    if (disabled) return;
    setSaving(assetId);
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
    setSaving(null);
  };

  // Quick add to scenario without drag
  const handleQuickAdd = async (assetId: string, scenario: string) => {
    if (disabled) return;
    
    // Check if already in scenario
    if (items.some((item) => item.assetId === assetId && item.scenario === scenario)) {
      return;
    }

    // Optimistic update
    setItems((prev) => [...prev, { scenario, assetId }]);

    await fetch("/api/scenarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        estateId,
        assetId,
        scenarioName: scenario,
        action: "add",
      }),
    });
  };

  return (
    <div className="grid gap-8">
      <div className="grid gap-6 xl:grid-cols-[1fr_1.5fr]">
        {/* Assets Panel */}
        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-semibold text-white">Available Assets</h2>
          <p className="mt-2 text-sm text-white/60">
            {disabled 
              ? "Accept estate rules to enable drag-and-drop." 
              : "Drag assets into scenarios or use the quick-add buttons."}
          </p>
          
          <div className="mt-4 grid gap-4">
            {assets.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 px-4 py-8 text-center text-sm text-white/50">
                No assets added yet. Add assets from the Assets tab.
              </div>
            ) : (
              assets.map((asset) => {
                const pref = prefs.get(asset.id) ?? {
                  assetId: asset.id,
                  emotionalScore: 0,
                  note: "",
                };
                const isDragging = draggingId === asset.id;
                
                return (
                  <div
                    key={asset.id}
                    className={`rounded-2xl border bg-black/30 p-4 transition-all duration-200 ${
                      isDragging 
                        ? "scale-[0.98] border-emerald-400/50 opacity-50 shadow-lg shadow-emerald-500/20" 
                        : disabled 
                          ? "cursor-not-allowed border-white/5 opacity-60"
                          : "cursor-grab border-white/10 hover:border-white/20 hover:bg-black/40 active:cursor-grabbing"
                    }`}
                    draggable={!disabled}
                    onDragStart={(e) => handleDragStart(asset.id, e)}
                    onDragEnd={handleDragEnd}
                  >
                    {/* Asset Header */}
                    <div className="flex items-start gap-3">
                      {asset.imageUrl ? (
                        <img
                          alt={asset.name}
                          className="h-16 w-16 rounded-xl border border-white/10 object-cover"
                          src={asset.imageUrl}
                        />
                      ) : (
                        <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-2xl">
                          📦
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="font-semibold text-white">{asset.name}</p>
                        {asset.description && (
                          <p className="mt-1 text-xs text-white/50 line-clamp-2">
                            {asset.description}
                          </p>
                        )}
                        <p className="mt-1 text-sm font-medium text-emerald-400">
                          ${estimateMid(asset).toLocaleString()}
                        </p>
                      </div>
                      {!disabled && (
                        <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-1">
                          <svg className="h-3 w-3 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                          </svg>
                          <span className="text-xs text-white/50">Drag</span>
                        </div>
                      )}
                    </div>

                    {/* Quick Add Buttons */}
                    {!disabled && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="text-xs text-white/40">Quick add:</span>
                        {scenarios.map((scenario) => {
                          const isInScenario = items.some(
                            (item) => item.assetId === asset.id && item.scenario === scenario
                          );
                          return (
                            <button
                              key={scenario}
                              type="button"
                              onClick={() => handleQuickAdd(asset.id, scenario)}
                              disabled={isInScenario}
                              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                                isInScenario
                                  ? "bg-emerald-500/20 text-emerald-300 cursor-default"
                                  : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
                              }`}
                            >
                              {isInScenario ? `✓ ${scenario}` : `+ ${scenario}`}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Emotional Score */}
                    <div className="mt-4 grid gap-3 border-t border-white/10 pt-4">
                      <label className="text-xs text-white/60">
                        <span className="flex items-center justify-between">
                          <span>Emotional value</span>
                          <span className="font-semibold text-white">
                            {pref.emotionalScore}/5
                          </span>
                        </span>
                        <input
                          className="mt-2 w-full accent-emerald-500"
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
                        className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-white placeholder:text-white/30"
                        placeholder="Why does this matter to you? (optional)"
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
                        className="w-fit rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50"
                        onClick={() => handleSavePreference(asset.id)}
                        type="button"
                        disabled={disabled || saving === asset.id}
                      >
                        {saving === asset.id ? "Saving..." : "Save preference"}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Scenarios Panel */}
        <section className="grid gap-4 lg:grid-cols-3">
          {scenarios.map((scenario) => {
            const scenarioAssets = assetsByScenario.get(scenario) ?? [];
            const isOver = dragOverScenario === scenario;
            const totalValue = scenarioAssets.reduce((sum, asset) => sum + estimateMid(asset), 0);
            
            return (
              <div
                key={scenario}
                className={`flex flex-col gap-3 rounded-3xl border p-4 transition-all duration-200 ${
                  isOver
                    ? "border-emerald-400/50 bg-emerald-500/10 shadow-lg shadow-emerald-500/10"
                    : draggingId
                      ? "border-white/20 bg-white/10"
                      : "border-white/10 bg-white/5"
                }`}
                onDragOver={(e) => handleDragOver(scenario, e)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(scenario, e)}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white">
                    Scenario {scenario}
                  </h3>
                  <span className="text-xs text-white/50">
                    {scenarioAssets.length} {scenarioAssets.length === 1 ? "asset" : "assets"}
                  </span>
                </div>
                
                {totalValue > 0 && (
                  <div className="text-xs text-emerald-400">
                    Total: ${totalValue.toLocaleString()}
                  </div>
                )}

                <div className="flex flex-1 flex-col gap-2">
                  {scenarioAssets.map((asset) => (
                    <div
                      key={asset.id}
                      className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/30 p-2"
                    >
                      {asset.imageUrl ? (
                        <img
                          alt={asset.name}
                          className="h-8 w-8 rounded-lg border border-white/10 object-cover"
                          src={asset.imageUrl}
                        />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-sm">
                          📦
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-white truncate">{asset.name}</p>
                        <p className="text-xs text-emerald-400/70">${estimateMid(asset).toLocaleString()}</p>
                      </div>
                      <button
                        className="rounded-full p-1 text-white/40 transition-colors hover:bg-white/10 hover:text-rose-400"
                        onClick={() => handleRemove(scenario, asset.id)}
                        type="button"
                        disabled={disabled}
                        title="Remove from scenario"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                  
                  {/* Drop Zone Indicator */}
                  {scenarioAssets.length === 0 || isOver ? (
                    <div
                      className={`flex flex-1 min-h-[80px] items-center justify-center rounded-xl border-2 border-dashed transition-colors ${
                        isOver
                          ? "border-emerald-400/50 bg-emerald-500/10 text-emerald-300"
                          : "border-white/10 bg-black/20 text-white/40"
                      }`}
                    >
                      <div className="text-center">
                        <p className="text-xs">
                          {isOver ? "Drop here!" : "Drag assets here"}
                        </p>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </section>
      </div>
    </div>
  );
}
