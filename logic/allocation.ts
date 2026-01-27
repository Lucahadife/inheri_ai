export type Heir = {
  id: string;
  name: string;
};

export type Asset = {
  id: string;
  name: string;
  valueLow: number | null;
  valueHigh: number | null;
  aiValueLow?: number | null;
  aiValueHigh?: number | null;
};

export type Preference = {
  assetId: string;
  heirId: string;
  emotionalScore: number;
  decedentBoost: number;
};

export type AllocationPlan = {
  name: string;
  assignments: Record<string, string>;
  totalsByHeir: Record<
    string,
    { valueTotal: number; emotionalTotal: number; deltaFromTarget: number }
  >;
};

export type TradeSuggestion = {
  assetId: string;
  assetName: string;
  fromHeirId: string;
  toHeirId: string;
  reason: string;
  counterAssetName?: string;
};

const midpoint = (asset: Asset) => {
  // Prefer AI values if available, fall back to manual values
  const low = asset.aiValueLow ?? asset.valueLow;
  const high = asset.aiValueHigh ?? asset.valueHigh;
  
  if (low != null && high != null) {
    return (low + high) / 2;
  }
  if (high != null) return high;
  if (low != null) return low;
  return 0;
};

const buildScoreMap = (preferences: Preference[]) => {
  const map = new Map<string, Map<string, number>>();
  preferences.forEach((pref) => {
    if (!map.has(pref.assetId)) {
      map.set(pref.assetId, new Map());
    }
    const total = pref.emotionalScore + pref.decedentBoost;
    map.get(pref.assetId)?.set(pref.heirId, total);
  });
  return map;
};

const initTotals = (heirs: Heir[]) => {
  const totals: Record<string, number> = {};
  heirs.forEach((heir) => {
    totals[heir.id] = 0;
  });
  return totals;
};

const calculateTotals = (
  planName: string,
  heirs: Heir[],
  assets: Asset[],
  assignments: Record<string, string>,
  scoreMap: Map<string, Map<string, number>>
) => {
  const totalValue = assets.reduce((sum, asset) => sum + midpoint(asset), 0);
  const targetShare = heirs.length ? totalValue / heirs.length : 0;
  const totalsByHeir: AllocationPlan["totalsByHeir"] = {};

  heirs.forEach((heir) => {
    totalsByHeir[heir.id] = {
      valueTotal: 0,
      emotionalTotal: 0,
      deltaFromTarget: 0,
    };
  });

  assets.forEach((asset) => {
    const heirId = assignments[asset.id];
    if (!heirId) return;
    totalsByHeir[heirId].valueTotal += midpoint(asset);
    const emotional = scoreMap.get(asset.id)?.get(heirId) ?? 0;
    totalsByHeir[heirId].emotionalTotal += emotional;
  });

  heirs.forEach((heir) => {
    totalsByHeir[heir.id].deltaFromTarget =
      totalsByHeir[heir.id].valueTotal - targetShare;
  });

  return {
    name: planName,
    assignments,
    totalsByHeir,
  };
};

const allocateValueFirst = (
  heirs: Heir[],
  assets: Asset[],
  scoreMap: Map<string, Map<string, number>>
) => {
  const totals = initTotals(heirs);
  const assignments: Record<string, string> = {};

  [...assets]
    .sort((a, b) => midpoint(b) - midpoint(a))
    .forEach((asset) => {
      const sortedHeirs = [...heirs].sort((a, b) => {
        const valueDiff = totals[a.id] - totals[b.id];
        if (valueDiff !== 0) return valueDiff;
        const scoreA = scoreMap.get(asset.id)?.get(a.id) ?? 0;
        const scoreB = scoreMap.get(asset.id)?.get(b.id) ?? 0;
        return scoreB - scoreA;
      });

      const chosen = sortedHeirs[0];
      assignments[asset.id] = chosen.id;
      totals[chosen.id] += midpoint(asset);
    });

  return assignments;
};

const allocateEmotionFirst = (
  heirs: Heir[],
  assets: Asset[],
  scoreMap: Map<string, Map<string, number>>,
  toleranceRatio: number
) => {
  const totals = initTotals(heirs);
  const assignments: Record<string, string> = {};
  const totalValue = assets.reduce((sum, asset) => sum + midpoint(asset), 0);
  const targetShare = heirs.length ? totalValue / heirs.length : 0;
  const maxShare = targetShare * (1 + toleranceRatio);

  [...assets]
    .sort((a, b) => {
      const bestA = Math.max(
        ...heirs.map((heir) => scoreMap.get(a.id)?.get(heir.id) ?? 0)
      );
      const bestB = Math.max(
        ...heirs.map((heir) => scoreMap.get(b.id)?.get(heir.id) ?? 0)
      );
      return bestB - bestA;
    })
    .forEach((asset) => {
      const ranked = [...heirs].sort((a, b) => {
        const scoreA = scoreMap.get(asset.id)?.get(a.id) ?? 0;
        const scoreB = scoreMap.get(asset.id)?.get(b.id) ?? 0;
        return scoreB - scoreA;
      });

      const value = midpoint(asset);
      let chosen = ranked.find((heir) => totals[heir.id] + value <= maxShare);

      if (!chosen) {
        chosen = [...heirs].sort((a, b) => totals[a.id] - totals[b.id])[0];
      }

      assignments[asset.id] = chosen.id;
      totals[chosen.id] += value;
    });

  return assignments;
};

export const buildAllocationPlans = (
  heirs: Heir[],
  assets: Asset[],
  preferences: Preference[],
  toleranceRatio = 0.1
) => {
  const scoreMap = buildScoreMap(preferences);
  const planA = calculateTotals(
    "Plan A (value-first)",
    heirs,
    assets,
    allocateValueFirst(heirs, assets, scoreMap),
    scoreMap
  );
  const planB = calculateTotals(
    "Plan B (emotion-first)",
    heirs,
    assets,
    allocateEmotionFirst(heirs, assets, scoreMap, toleranceRatio),
    scoreMap
  );

  return { planA, planB };
};

export const suggestTrades = (
  plan: AllocationPlan,
  heirs: Heir[],
  assets: Asset[],
  preferences: Preference[]
): TradeSuggestion[] => {
  const scoreMap = buildScoreMap(preferences);
  const assetMap = new Map(assets.map((asset) => [asset.id, asset]));
  const byHeir = new Map<string, Asset[]>();

  assets.forEach((asset) => {
    const heirId = plan.assignments[asset.id];
    if (!heirId) return;
    if (!byHeir.has(heirId)) {
      byHeir.set(heirId, []);
    }
    byHeir.get(heirId)?.push(asset);
  });

  const suggestions: TradeSuggestion[] = [];

  assets.forEach((asset) => {
    const assignedHeir = plan.assignments[asset.id];
    if (!assignedHeir) return;
    const scores = heirs.map((heir) => ({
      heirId: heir.id,
      score: scoreMap.get(asset.id)?.get(heir.id) ?? 0,
    }));
    scores.sort((a, b) => b.score - a.score);

    const top = scores[0];
    const current = scores.find((score) => score.heirId === assignedHeir);

    if (!top || !current || top.heirId === assignedHeir) return;
    if (top.score - current.score < 2) return;

    const candidateAssets = byHeir.get(top.heirId) ?? [];
    const assetValue = midpoint(asset);
    const counterAsset = candidateAssets
      .filter((candidate) => candidate.id !== asset.id)
      .sort(
        (a, b) => Math.abs(midpoint(a) - assetValue) - Math.abs(midpoint(b) - assetValue)
      )[0];

    suggestions.push({
      assetId: asset.id,
      assetName: asset.name,
      fromHeirId: assignedHeir,
      toHeirId: top.heirId,
      reason: `High preference gap (${top.score} vs ${current.score}).`,
      counterAssetName: counterAsset?.name,
    });
  });

  return suggestions.slice(0, 5);
};
