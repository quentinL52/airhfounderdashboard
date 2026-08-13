# Helmdash

An operating system for solo founders. Multi-provider AI agents that read your real business state (runway, pipeline, hypotheses, roadmap) and propose changes you approve before anything is written.

**Live:** [founderdashboard.vercel.app](https://founderdashboard.vercel.app)

`Next.js 15` · `React 19` · `TypeScript strict` · `Prisma` · `Postgres + pgvector` · `Supabase RLS` · `Vercel AI SDK` · `Stripe` · `BullMQ` · `Playwright`

---

## The problem

A solo founder holds finance, GTM, product, and research at once, with no one to delegate to and no one to check their reasoning. Generic AI chat does not help: it has no access to your actual numbers, it forgets everything between sessions, and it cannot act.

Helmdash is the other shape. Structured business state in Postgres, agents that read that state, and a write path that always goes through human approval.

---

## Architecture

```mermaid
flowchart TB
    subgraph app["Next.js 15 App Router"]
        UI["Dashboard<br/>dnd-kit adaptive grid"]
        MW["middleware.ts<br/>auth + locale"]
        API["Route handlers<br/>/api/ai/*"]
    end

    subgraph ai["Agent layer"]
        ORCH["Agent orchestrator<br/>registry of 8 agents"]
        PROV["Provider registry<br/>OpenAI · Anthropic · Mistral · Gemini"]
        PROP["Agent proposals<br/>pending / confirmed / rejected"]
    end

    subgraph mem["Memory"]
        VEC[("memory_notes<br/>pgvector 3072d")]
        GRAPH[("graph_nodes / graph_edges<br/>typed, weighted")]
    end

    subgraph data["Persistence"]
        PG[("Postgres via Prisma<br/>Supabase RLS")]
        REDIS[("Upstash Redis<br/>rate limiting")]
        QUEUE["BullMQ<br/>scheduled tasks"]
    end

    subgraph money["Billing"]
        STRIPE["Stripe"]
        LOG[("stripe_event_log<br/>idempotency")]
        SEAT[("seat_reservation<br/>TTL locks")]
    end

    UI --> MW --> API --> ORCH
    ORCH --> PROV
    ORCH --> PROP
    ORCH --> VEC
    ORCH --> GRAPH
    PROP -->|"user confirms"| PG
    API --> REDIS
    QUEUE --> ORCH
    STRIPE --> LOG
    STRIPE --> SEAT
    LOG --> PG
```

---

## Engineering decisions

### Agents propose, they never write

An agent that mutates your finance table directly is a liability. Every agent action lands in an `agent_proposals` row carrying a domain, an action, a JSON payload, and a computed diff, with status `pending`. Nothing touches business tables until the user confirms.

This makes the whole agent layer auditable after the fact and safely reversible before it. It also means a bad model response is a rejected proposal instead of a corrupted runway calculation.

### Provider-agnostic agents through two registries

Agents and providers are separate registries. An `AgentDefinition` declares `buildSystemPrompt`, `buildUserMessage`, and `parseResponse` against a typed `AgentContext`. A `ProviderRegistry` resolves the caller's chosen model at execution time.

Adding a ninth agent is one registration call. Adding a fifth provider is one adapter. Neither touches the other. Users bring their own key and pick their own model per agent, which also moves inference cost off the platform and onto the user.

### Per-user envelope encryption for BYOK keys

User API keys are never stored in plaintext. Each user gets a random salt persisted in `user_encryption_keys`; the data key is derived from a master key plus that salt, and the provider key is encrypted under it. Compromising one user's ciphertext does not compromise another's, and key rotation is versioned in the same table.

### Hybrid memory: vectors for recall, a graph for structure

Semantic search alone loses relationships. `memory_notes` carries 3072-dimension embeddings for retrieval, while `graph_nodes` and `graph_edges` hold an explicit, typed, weighted knowledge graph (Concept, Person, Project, with relations like `RELATES_TO` and `CAUSED_BY`, uniqueness enforced on the triple).

Vectors answer "what is relevant". The graph answers "what depends on what". Agents need both.

### Billing built for the failure cases, not the happy path

- **Webhook idempotency.** Every Stripe event ID is recorded in `stripe_event_log` before processing, so redelivery is a no-op rather than a double charge.
- **Seat reservations with a TTL.** Cohort pricing is capped by seat count. A checkout session takes an expiring `seat_reservation` row, so two simultaneous buyers cannot oversell the last founder slot, and an abandoned checkout releases the seat automatically.
- **Cohort state on the user record.** `cohort`, `cohortRank`, `priceLockedForever`, and `cohortLockedUntil` make the pricing promise enforceable in the database rather than in marketing copy.

### Cost telemetry as a first-class table

`ai_cost_logs` records tokens, model, and estimated cost per call, scoped by feature (`onboarding`, `brief`, `chat`, `subagent`). `ai_usage` aggregates the same into monthly rows under a `(user, month, scope)` unique constraint.

Per-feature unit economics are a query, not an estimate. Plan limits read from a `plan_config` table, so changing a quota is a row update rather than a deploy.

---

## Quality gates

CI runs on every PR into `main`. Beyond lint, typecheck, tests, and build, it enforces five checks that exist because of specific mistakes worth preventing.

| Gate | What it catches |
|---|---|
| **Type ratchet** | Compares `tsc --noEmit` error count against a committed baseline. Fails if the count rises, rewrites the baseline lower when it falls. Type debt can only shrink. |
| **Color ratchet** | Same mechanism for hardcoded hex and rgb values per file. Design tokens can only gain ground. |
| **Service role guard** | Greps client components and app routes for `SUPABASE_SERVICE_ROLE_KEY` and fails the build if it appears. A privilege-escalation class of bug, blocked mechanically. |
| **Live auth smoke test** | Boots the production build, then asserts that 13 AI, billing, and memory routes return 401 without a session cookie. Unauthenticated route regressions cannot merge. |
| **Landing claim lint** | Scans the marketing page and both locale files for feature claims the product does not ship (SSO, SLA, audit logs, unlimited agents, guaranteed). Roadmap-only terms are allowed inside the roadmap section and nowhere else. |

The last one is the one worth stealing. Marketing copy drifts ahead of the product by default. Here it is a build failure.

Two more scripts keep internationalization honest: a key-sync check across locale files, and a scanner that fails on hardcoded French strings in the source.

---

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 App Router, React 19, TypeScript strict |
| Data | Prisma over Postgres (Supabase), pgvector, row-level security |
| AI | Vercel AI SDK, adapters for OpenAI, Anthropic, Mistral, Gemini; Genkit for flows |
| Async | BullMQ over Redis for scheduled agent runs, Upstash for rate limiting |
| Payments | Stripe with idempotent webhook handling |
| UI | Tailwind, Radix primitives, dnd-kit drag-and-drop grid, Recharts |
| i18n | next-intl, English and French, enforced by CI |
| Observability | Sentry, PostHog |
| Testing | Vitest with v8 coverage, Playwright end to end |
| Integrations | Composio MCP |

50 Prisma models across finance, CRM, GTM, roadmap, lean canvas, hypotheses, gamification, memory, and billing.

---

## Running locally

```bash
npm install                  # postinstall runs prisma generate
cp env.example .env.local    # Supabase, Stripe, and at least one AI provider key
npx prisma migrate deploy
npm run dev                  # http://localhost:9002
```

```bash
npm run typecheck            # type ratchet
npm test                     # vitest
npm run test:e2e             # playwright
npm run build                # color ratchet, then next build
```

---

## Layout

```
src/lib/ai/          Agent orchestrator, provider registry, BYOK key encryption
src/app/(app)/       Authenticated dashboard
src/app/(marketing)/ Public landing, claim-linted
src/app/api/         Route handlers, all session-gated
prisma/schema.prisma 50 models
scripts/             Ratchets, auth smoke test, claim lint, i18n sync
tests/               Vitest unit and integration
messages/            en.json, fr.json, key-synced in CI
```

---

## Status

Pre-launch. Waitlist open, cohort pricing live, target launch September 2026. Built and shipped solo.

## License

See [LICENSE](LICENSE). Security policy in [SECURITY.md](SECURITY.md).
