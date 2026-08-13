- [x] Chantier E (Agents Config-as-Data) :
  - Création des 5 fichiers Markdown d'agents actifs sous `src/lib/ai/agents/registry/` (`barreur.md`, `cfo.md`, `growth.md`, `research.md`, `content.md`) avec YAML frontmatter (id, name, mission, domainsRead, domainsWrite, tools, defaultModel, guardrails) et corps de prompt système.
  - Déplacement des sub-agents legacy sous `src/lib/ai/agents/registry/disabled/` (`legal.md`, `recruiting.md`, `tech-lead.md`, `pm.md`).
  - Implémentation du loader `src/lib/ai/agents/agent-loader.ts` avec validation Zod stricte (`AgentFrontmatterSchema`) et throw d'erreur Zod au boot si invalide.
  - Tests unitaires GATE E (`tests/unit/agent-loader.test.ts`) validés à 100%.

- [x] Chantier T (Dette Continue & CI Ratchet) :
  - Ratchet `: any` avec `scripts/any-baseline.json` et `scripts/any-ratchet.mjs` validés en CI.
  - 37 tests unitaires au vert sur 9 fichiers de test.
  - Vérification TypeScript `npx tsc --noEmit` avec 0 erreur.
