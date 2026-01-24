# Demo Guide

This guide covers the demo flow once the seed script is available.

## Planned demo flow
1) Log in as the executor.
2) Open the demo estate.
3) Review assets and documents.
4) Switch to a heir account and set preferences.
5) Generate allocations and review fairness table.
6) Use AI helpers for valuation and dispute resolution.

## Seed data
Seed scripts live in `scripts/`.

### Demo seed
```
node --env-file .env.local scripts/seed-demo.mjs
```

Demo users:
- executor@fairsplit.ai
- heir1@fairsplit.ai
- heir2@fairsplit.ai

Default password: `ChangeMe123!`
