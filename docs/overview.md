# FairSplit AI Overview

FairSplit AI helps families fairly divide estates by combining market values with emotional preferences. The core allocation engine is rule-based and explainable. AI features are optional helpers that provide context and suggestions without overriding rules.

## Users and roles
- Executor/Admin: creates estates, manages assets, invites heirs, applies decedent boosts.
- Heir: submits preferences and builds scenarios (carts).

## Core flows (v1)
1) Auth: users sign up and log in with Supabase Auth.
2) Estates: executor creates an estate and adds members.
3) Assets: executor adds assets and uploads supporting documents.
4) Preferences: heirs rate emotional importance per asset.
5) Scenarios: heirs create Scenario A/B carts.
6) Allocation: system generates candidate plans and fairness tables.
7) AI helpers: valuation context, doc summary, and dispute resolution.

## Non-goals (v1)
- No automated email invites.
- No advanced legal workflows or e-signatures.
