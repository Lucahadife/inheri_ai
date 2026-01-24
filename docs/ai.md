# AI Features

AI helpers are separated from the core fairness logic. They provide context and suggestions but do not change allocations directly.

## Endpoints
- `POST /api/ai/value-estimate`
- `POST /api/ai/doc-summary`
- `POST /api/ai/resolve`

## Prompts and schemas
- Prompts are stored in `ai/prompts/` and are easy to inspect.
- Responses are validated with Zod schemas in `ai/schemas/`.

## Provider
- `ai/provider.ts` wraps the default OpenAI client.
- The provider is swappable for testing or future vendors.
