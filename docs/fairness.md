# Fairness & Allocation Logic

The allocation engine is rule-based and explainable.

## Inputs
- Market value ranges (midpoint used for calculations).
- Heir emotional preference scores (0–5).
- Decedent preference boosts (0–2).

## Objectives (v1)
1) Keep market value per heir close to equal share within a tolerance.
2) Maximize total emotional satisfaction once fairness is met.

## Outputs
- Two candidate plans (Plan A and Plan B).
- A fairness table comparing value balance and emotional totals.
- Trade suggestions when multiple heirs strongly prefer the same asset.
