#!/usr/bin/env bash
# ============================================================
# HELMDASH — Injection du backlog complet dans GitHub Issues
# Usage:  REPO="quentinL52/helmdash" ./create_issues.sh
# Prérequis: gh CLI authentifié (gh auth status)
# Idempotence: relancer le script recrée les issues (pas de check
# de doublon) — à exécuter UNE fois sur un repo sans issues.
# ============================================================
set -euo pipefail

REPO="${REPO:-quentinL52/helmdash}"

echo "==> Repo cible: $REPO"
gh repo view "$REPO" >/dev/null

# ------------------------------------------------------------
# 1. LABELS
# ------------------------------------------------------------
echo "==> Création des labels…"
declare -A LABELS=(
  ["P0"]="b60205" ["P1"]="fbca04"
  ["security"]="d93f0b" ["data"]="1d76db" ["billing"]="0e8a16"
  ["design"]="c5def5" ["i18n"]="5319e7" ["agents"]="f9d0c4"
  ["frontend"]="bfdadc" ["backend"]="0052cc" ["infra"]="ededed"
  ["legal"]="000000" ["qa"]="e4e669"
)
for name in "${!LABELS[@]}"; do
  gh label create "$name" --repo "$REPO" --color "${LABELS[$name]}" --force >/dev/null
done

# ------------------------------------------------------------
# 2. MILESTONES (S1..S4)
# ------------------------------------------------------------
echo "==> Création des milestones…"
create_milestone() {
  local title="$1"; local due="$2"; local desc="$3"
  if ! gh api "repos/$REPO/milestones" --jq '.[].title' | grep -qx "$title"; then
    gh api "repos/$REPO/milestones" -f title="$title" -f due_on="${due}T23:59:59Z" -f description="$desc" >/dev/null
  fi
}
create_milestone "S1 - Fondations & Sécurité"      "2026-07-10" "Repo, identité, auth API, billing setup, tokens design"
create_milestone "S2 - Persistance & Design"       "2026-07-17" "Migration Prisma, purge couleurs, checkout, i18n setup"
create_milestone "S3 - Agents & Onglets"           "2026-07-24" "Onboarding, brief hebdo, refonte onglets, intégrations"
create_milestone "S4 - Landing & Launch"           "2026-07-31" "Landing, tests, légal, ops, dry run"

# ------------------------------------------------------------
# 3. HELPER
# ------------------------------------------------------------
N=0
issue() {
  local title="$1"; local labels="$2"; local milestone="$3"
  N=$((N+1))
  gh issue create --repo "$REPO" --title "$title" --label "$labels" \
    --milestone "$milestone" --body-file - >/dev/null
  echo "  [$N] $title"
}

echo "==> Création des issues…"

# ============================================================
# EPIC 0 — REPO, IDENTITÉ & FONDATIONS
# ============================================================

issue "HD-001 · Repo privé + purge documents stratégiques" "P0,infra" "S1 - Fondations & Sécurité" <<'EOF'
**Epic 0 — Repo & fondations** · Estimation: 0.5 j/2 · Deps: —

### Tâches
- [ ] Passer le repo en privé, renommer en `helmdash`
- [ ] Retirer du tracking: `airhfounderdashboard-improvement-proposal.md`, `documentation/strategie_distribution_paiement.md`, `documentation/veille-strategique.md`, `build_log*.txt`, `.FullName`, `.modified`, `.idx/`, `.claude/worktrees/` → vault Obsidian privé
- [ ] `.gitignore`: `build_log*.txt`, `.idx/`, `.claude/worktrees/`
- [ ] Si repo public vitrine conservé: `git filter-repo` sur l'historique

### Critères d'acceptation
- [ ] `git ls-files | grep -iE "strategie|veille|proposal|build_log"` → vide
EOF

issue "HD-002 · Purge naming → Helmdash partout" "P0,infra,frontend" "S1 - Fondations & Sécurité" <<'EOF'
**Epic 0** · Estimation: 1 j/2 · Deps: —

### Tâches
- [ ] `README.md` réécrit EN (IgniteHQ ×3), `documentation/blueprint.md`
- [ ] `env.example`: `NEXT_PUBLIC_APP_NAME`, `EMAIL_FROM`
- [ ] `package.json`: `"name": "helmdash"`
- [ ] Page login: header « AIRH Founder Central », « Bienvenue sur FounderOS », footer « Built for AIRH »
- [ ] Metadata Next + OG sur toutes les pages ; favicon/OG placeholder Helmdash

### Critères d'acceptation
- [ ] `grep -riE "ignitehq|airh|founderos|founder os" src public README.md documentation --include="*.ts*" --include="*.md" --include="*.html"` → 0
- [ ] Titre d'onglet navigateur = « Helmdash » partout
EOF

issue "HD-003 · CI GitHub Actions (lint, typecheck, test, build)" "P0,infra,qa" "S1 - Fondations & Sécurité" <<'EOF'
**Epic 0** · Estimation: 1 j/2 · Deps: — · **À merger en premier absolu**

### Tâches
- [ ] Workflow PR: `npm ci` → `lint` → `typecheck` → `test` → `build`, cache node_modules
- [ ] Branch protection `main`: CI verte requise

### Critères d'acceptation
- [ ] PR avec erreur TS bloquée · pipeline < 8 min
EOF

issue "HD-004 · Validation des env vars au boot (src/lib/env.ts)" "P0,infra,backend" "S1 - Fondations & Sécurité" <<'EOF'
**Epic 0** · Estimation: 0.5 j/2 · Deps: —

### Tâches
- [ ] Schéma Zod de toutes les env requises (DATABASE_URL, Supabase, MASTER_ENCRYPTION_KEY, CRON_SECRET, Stripe, AI_API_KEY…)
- [ ] Parse au démarrage, throw explicite
- [ ] Remplacer les `process.env.X!` dispersés par l'import de `env`

### Critères d'acceptation
- [ ] Boot sans `CRON_SECRET` → erreur claire (plus de `Bearer undefined` silencieux)
EOF

issue "HD-005 · SECURITY.md + LICENSE" "P1,infra" "S1 - Fondations & Sécurité" <<'EOF'
**Epic 0** · Estimation: 0.5 j/2 · Deps: —

- [ ] `SECURITY.md` (contact responsible disclosure)
- [ ] `LICENSE` propriétaire
EOF

# ============================================================
# EPIC 1 — SÉCURITÉ
# ============================================================

issue "HD-010 · Helper withAuth + withRateLimit + withValidation" "P0,security,backend" "S1 - Fondations & Sécurité" <<'EOF'
**Epic 1 — Sécurité** · Estimation: 1 j/2 · Deps: —

### Tâches
- [ ] `src/lib/security/with-auth.ts`: session Supabase → 401 ; expose `userId`
- [ ] `withRateLimit(handler, {rpm})` (Upstash) chaînable
- [ ] `withValidation(schema)` (Zod body) chaînable
- [ ] Tests unitaires: sans cookie → 401 ; session valide → handler(userId de session)
- [ ] `src/lib/security/README.md` avec exemple

### Critères d'acceptation
- [ ] Les 3 wrappers composables et testés
EOF

issue "HD-011 · Fix IDOR critique /api/ai/chat/stream" "P0,security,backend" "S1 - Fondations & Sécurité" <<'EOF'
**Epic 1** · Estimation: 1 j/2 · Deps: HD-010

### Contexte
Le `userId` est lu dans le body sans vérification de session → lecture/écriture des données de n'importe quel utilisateur via `CoreAgent.write_dashboard_tab`.

### Tâches
- [ ] `withAuth` sur la route ; supprimer `userId` du body
- [ ] `new CoreAgent(session.userId)`
- [ ] Maj clients `ChatUI.tsx` / `PageAgent.tsx` (n'envoient plus userId)
- [ ] Rate limit 30 req/min/user

### Critères d'acceptation
- [ ] User A authentifié + `{"userId":"<B>"}` dans le body → tout est scoppé A (test d'intégration)
EOF

issue "HD-012 · Auth sur les 9 routes IA restantes" "P0,security,backend" "S1 - Fondations & Sécurité" <<'EOF'
**Epic 1** · Estimation: 2 j/2 · Deps: HD-010

### Routes
`api/ai/route.ts`, `agents/coach`, `agents/crm`, `agents/content`, `market-scan`, `competitor-profile`, `competitive-intelligence`, `strategic-recommendations`, `models`

### Tâches
- [ ] `withAuth` + schéma Zod du body sur chacune
- [ ] Suppression du champ `apiKey` du body (voir HD-014)
- [ ] `scripts/check-auth.sh`: curl sans cookie sur chaque route → attend 401, branché CI

### Critères d'acceptation
- [ ] `check-auth.sh` passe en CI
EOF

issue "HD-013 · Auth billing + durcissement webhooks/crons" "P0,security,backend" "S1 - Fondations & Sécurité" <<'EOF'
**Epic 1** · Estimation: 1 j/2 · Deps: HD-010

### Tâches
- [ ] `api/billing/stripe/sync`: `withAuth` + customer Stripe ∈ userId
- [ ] `api/memory/extract-entities`: `withAuth`
- [ ] `api/integrations/composio/webhook`: vérification signature HMAC → 401 sinon
- [ ] Crons: garde `if (!CRON_SECRET) return 500` (avec HD-004)
- [ ] Test d'intégration: webhook Stripe signature invalide → 400
EOF

issue "HD-014 · Refonte BYOK : clés API côté serveur uniquement" "P0,security,backend,frontend" "S1 - Fondations & Sécurité" <<'EOF'
**Epic 1** · Estimation: 2 j/2 · Deps: HD-012

### Tâches
- [ ] `PUT /api/settings/ai-keys` (auth): `{provider, apiKey}` → AES-256-GCM (`api-key-encryption.ts` existant) → upsert `AiSettings`
- [ ] `POST /api/settings/ai-keys/test`: appel minimal provider → `{ok}` sans écho de clé
- [ ] `DELETE`: purge immédiate
- [ ] Toutes les routes agents lisent via `decryptAiSettings(userId)` ; plus aucun `apiKey` accepté du client (supprimer des interfaces `CoachRequest` etc.)
- [ ] `maskKey()` sur tout log contenant `sk-`
- [ ] Refonte UI `ai-settings-panel.tsx`: saisie, statut « configured ✓ », test, delete, mention chiffrement

### Critères d'acceptation
- [ ] Network tab vierge de toute clé après configuration
- [ ] Clé jamais dans une réponse API · test roundtrip chiffrement
EOF

issue "HD-015 · Headers sécurité (CSP…) + npm audit" "P0,security,infra" "S1 - Fondations & Sécurité" <<'EOF'
**Epic 1** · Estimation: 1 j/2 · Deps: —

### Tâches
- [ ] `next.config.ts`: CSP (Supabase, Stripe, PostHog, providers), `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`
- [ ] `npm audit`: traiter criticals/highs, documenter les exceptions
- [ ] Garde CI: `SERVICE_ROLE` absent de `src/components` et composants client
EOF

issue "HD-016 · RLS Supabase sur toutes les tables user-scopées" "P1,security,data" "S2 - Persistance & Design" <<'EOF'
**Epic 1** · Estimation: 2 j/2 · Deps: —

### Tâches
- [ ] Policies `user_id = auth.uid()` sur toutes les tables
- [ ] Vérifier compat Prisma (service role serveur = bypass contrôlé)

### Critères d'acceptation
- [ ] Requête PostgREST anon key sur la table d'un autre user → 0 lignes
EOF

# ============================================================
# EPIC 2 — PRICING & BILLING
# ============================================================

issue "HD-020 · Modèle de données cohortes (Prisma)" "P0,billing,data" "S1 - Fondations & Sécurité" <<'EOF'
**Epic 2 — Billing** · Estimation: 1 j/2 · Deps: —

### Tâches
- [ ] `User.cohort` enum(founders,early,full), `User.cohortRank Int?`, `User.cohortLockedUntil DateTime?`
- [ ] Table `CohortCounter(cohort, sold Int)` pour verrou transactionnel
- [ ] Migration + backfill users de test → `full`
EOF

issue "HD-021 · Produits Stripe cohortes + refonte stripe-client.ts" "P0,billing,backend" "S1 - Fondations & Sécurité" <<'EOF'
**Epic 2** · Estimation: 1 j/2 · Deps: —

### Tâches
- [ ] Prices Stripe (EUR, centimes): `founders_6m` 2500, `early_6m` 4500, `early_yearly` 7900, `full_monthly` 1200, `full_6m` 5900, `full_yearly` 9900
- [ ] `stripe-client.ts`: map `PRICING` unique, suppression starter/growth/scale
- [ ] `env.example` + `env.ts` (HD-004) mis à jour
- [ ] Constante partagée `src/lib/billing/pricing.ts` (source unique landing/app/checkout)
EOF

issue "HD-022 · Attribution de cohorte transactionnelle (race-safe)" "P0,billing,backend" "S1 - Fondations & Sécurité" <<'EOF'
**Epic 2** · Estimation: 2 j/2 · Deps: HD-020, HD-021

### Tâches
- [ ] `assignCohort(userId)` sur `checkout.session.completed`: transaction `SELECT ... FOR UPDATE` sur `CohortCounter` → founders si sold<100, early si <200, sinon full ; incrément ; `cohortRank`
- [ ] Prix déterminé serveur à la création de session Checkout (client ne choisit que la périodicité)
- [ ] Réservation de siège à la création de session (TTL 30 min), libération sur `checkout.session.expired`

### Critères d'acceptation
- [ ] Test: 2 checkouts concurrents autour du seuil 100 → un founders + un early, aucun doublon de rank
EOF

issue "HD-023 · Endpoint public compteur de sièges cohorte" "P0,billing,backend" "S1 - Fondations & Sécurité" <<'EOF'
**Epic 2** · Estimation: 0.5 j/2 · Deps: HD-020

- [ ] `GET /api/billing/cohort-status` (public, cache 60 s, rate limit IP) → `{cohort, seatsLeft, nextPrice}`
- [ ] Consommé par landing (HD-101) et pricing in-app (HD-027)
EOF

issue "HD-024 · Refonte checkout + webhooks cycle de vie + mode readonly" "P0,billing,backend,frontend" "S2 - Persistance & Design" <<'EOF'
**Epic 2** · Estimation: 2 j/2 · Deps: HD-022

### Tâches
- [ ] `api/billing/checkout` (auth): session sur le price de la cohorte courante + périodicité ; metadata userId
- [ ] Webhooks: `checkout.session.completed` (assign + activation), `customer.subscription.deleted` (fin de période → `planStatus='readonly'`), `invoice.payment_failed` (grace 7 j + email), `checkout.session.expired` (libère le siège)
- [ ] Mode readonly: bannière + mutations 403 `subscription_required`, données jamais supprimées

### Critères d'acceptation
- [ ] Parcours Stripe test complet · résiliation → accès fin de période puis readonly vérifié
EOF

issue "HD-025 · Trial 14 jours sans carte" "P0,billing,backend" "S2 - Persistance & Design" <<'EOF'
**Epic 2** · Estimation: 1 j/2 · Deps: HD-024

- [ ] `trial-manager.ts`: `trialEndsAt = signup+14j` ; expiration → readonly + écran souscription
- [ ] Email J10 (Resend) avec places restantes de la cohorte
- [ ] Supprimer la conversion legacy vers `starter`
EOF

issue "HD-026 · Suppression du feature-gating par tier" "P0,billing,frontend" "S2 - Persistance & Design" <<'EOF'
**Epic 2** · Estimation: 1 j/2 · Deps: —

- [ ] Supprimer `Paywall`/`requiredTier`/`TIER_LEVELS` → créer `TrialGate` (trial expiré/readonly → écran souscription)
- [ ] Retirer le gate growth|scale de `api/ai/weekly-report` (remplacé par opt-in HD-065)
- [ ] Grep: `planTier` ne conditionne plus aucune feature
EOF

issue "HD-027 · Refonte billing-panel + pricing in-app" "P0,billing,frontend" "S2 - Persistance & Design" <<'EOF'
**Epic 2** · Estimation: 2 j/2 · Deps: HD-023

### Tâches
- [ ] Affiche: cohorte + badge + rank (« Founding Member #37 »), formule, prochaine facture, portal Stripe, compteur sièges si non abonné, toggle mensuel/6 mois/annuel
- [ ] Suppression des 3 cartes Starter/Growth/Scale et features fantômes (SSO, seats, SLA, on-premise…)

### Critères d'acceptation
- [ ] Prix affichés == Stripe == landing (via `pricing.ts` HD-021)
EOF

issue "HD-028 · Badges cohorte in-app (Founding Member / Early Adopter)" "P1,billing,frontend" "S3 - Agents & Onglets" <<'EOF'
**Epic 2** · Estimation: 0.5 j/2 · Deps: HD-022, HD-034

- [ ] Badge « Founding Member » (+500 XP) / « Early Adopter » (+250 XP) attribués serveur à l'activation
EOF

# ============================================================
# EPIC 3 — PERSISTANCE
# ============================================================

issue "HD-030 · API CRUD générique /api/data/[domain]" "P0,data,backend" "S2 - Persistance & Design" <<'EOF'
**Epic 3 — Persistance** · Estimation: 2 j/2 · Deps: HD-010

### Tâches
- [ ] Route GET/POST/PATCH/DELETE auth, réutilisant `validateTabData` + `getPrismaModel` (déjà écrits pour le CoreAgent)
- [ ] Domaines initiaux: finances, hypotheses, gtm, crm, roadmap, canvas
- [ ] Pagination (take/cursor), tri, `where` whitelisté par domaine
- [ ] Tests d'intégration: 401 sans session, isolation A/B, payload invalide → 400
EOF

issue "HD-031 · Extension registry domaines (journal, routine, content, okr)" "P0,data,backend" "S2 - Persistance & Design" <<'EOF'
**Epic 3** · Estimation: 1 j/2 · Deps: HD-030

- [ ] Ajouter à `dashboard-tools.ts`: `journal` (MoodEntry), `routine` (Task/Streak), `content`, `okr` — avec schémas Zod
- [ ] Bénéfice double: UI + CoreAgent gagnent ces domaines
EOF

issue "HD-032 · Migration founder-store → cache optimiste sur API (9 domaines)" "P0,data,frontend" "S2 - Persistance & Design" <<'EOF'
**Epic 3** · Estimation: 4 j/2 (2 jours) · Deps: HD-030, HD-031 · **Chantier le plus lourd — 1 PR par domaine**

### Tâches
- [ ] Supprimer `supabaseStorage` custom ; `persist` limité aux préférences UI (thème, layout, langue)
- [ ] Par domaine (ordre: finances → hypotheses → crm → roadmap → canvas → gtm → journal → routine → content): actions store = mutation `/api/data/*` + optimistic update + rollback/toast ; hydratation au mount (`store-ready-gate`)

### Critères d'acceptation (par domaine)
- [ ] create/update/delete visibles après hard refresh ET depuis un second navigateur
- [ ] Aucune écriture localStorage des données métier
EOF

issue "HD-033 · Migration des données localStorage existantes" "P0,data,frontend,backend" "S2 - Persistance & Design" <<'EOF'
**Epic 3** · Estimation: 1.5 j/2 · Deps: HD-032

- [ ] `POST /api/data/import` (auth, idempotent, dédoublonnage par hash)
- [ ] `MigrationBanner` au login si blob local + `User.migratedAt` null → « Import your local data » → rapport → `migratedAt` set + nettoyage local
EOF

issue "HD-034 · Gamification serveur (XP, quêtes, streaks)" "P0,data,backend" "S2 - Persistance & Design" <<'EOF'
**Epic 3** · Estimation: 2 j/2 · Deps: HD-030

### Tâches
- [ ] `GamificationService` backend: événements des routes CRUD (hypothesis.created, finance.entry.created, canvas.section.completed, routine.completed…) → XP (`xp-table`), quêtes (`quest-engine`), streaks (timezone user HD-076)
- [ ] Tables `UserProgress`, `QuestProgress`, `AchievementUnlock` (Streak existe)
- [ ] `GET /api/gamification/state` ; `gamification-store` → lecture seule + polling 30 s v1
- [ ] Idempotence par event id

### Critères d'acceptation
- [ ] Modification du store console → aucun effet après refresh
- [ ] XP versé une seule fois par événement
EOF

issue "HD-035 · Historique de conversation agent persisté" "P0,data,backend" "S2 - Persistance & Design" <<'EOF'
**Epic 3** · Estimation: 1 j/2 · Deps: HD-030

- [ ] Tables `Conversation` / `Message` (role, content, agentId, tokens)
- [ ] Le chat stream écrit chaque tour ; reprise au chargement de la page Agent
- [ ] v1: une conversation continue + bouton « new chat »
EOF

# ============================================================
# EPIC 4 — DESIGN SYSTEM
# ============================================================

issue "HD-040 · Tokens sémantiques + règle lint couleurs (CI)" "P0,design,frontend" "S1 - Fondations & Sécurité" <<'EOF'
**Epic 4 — Design** · Estimation: 1 j/2 · Deps: — · **À merger en premier de l'epic**

### Tâches
- [ ] `globals.css`: `--success`, `--warning`, `--danger`, `--info` désaturés (clair+sombre) ; `--chart-1..5` en déclinaisons marine→orange
- [ ] Règle ESLint regex fail sur `(text|bg|border|from|to|via|fill|stroke)-(red|green|yellow|purple|pink|cyan|emerald|violet|amber|rose|indigo|fuchsia|lime|teal|sky|blue)-[0-9]+` → branchée CI (HD-003)
EOF

issue "HD-041 · Composant StatusBadge sémantique" "P0,design,frontend" "S2 - Persistance & Design" <<'EOF'
**Epic 4** · Estimation: 0.5 j/2 · Deps: HD-040

- [ ] `StatusBadge` variants success|warning|danger|neutral|info — remplace tous les badges colorés ad hoc
EOF

issue "HD-042 · Codemod purge des 207 classes couleurs hardcodées" "P0,design,frontend" "S2 - Persistance & Design" <<'EOF'
**Epic 4** · Estimation: 2 j/2 · Deps: HD-040, HD-041

### Tâches
- [ ] `scripts/color-codemod.ts`: map green→success, red/rose→danger, yellow/amber→warning, blue/cyan/indigo/sky/purple/violet/pink/teal→info|secondary|chart-N (TODO comments sur les ambigus)
- [ ] Passe auto + revue manuelle fichier par fichier (hors competitive-watch → HD-043)

### Critères d'acceptation
- [ ] Lint couleurs = 0 erreur hors `competitive-watch/`
EOF

issue "HD-043 · Refonte visuelle Competitive Watch (~70 occurrences)" "P0,design,frontend" "S2 - Persistance & Design" <<'EOF'
**Epic 4** · Estimation: 2 j/2 · Deps: HD-042 · Couplé HD-082

- [ ] Reprise aux tokens des 8 composants (`feature-matrix-tab`, `threat-matrix`, `action-items-panel`, `lean-dashboard-tab`, `market-signals-tab`, `intelligence-dashboard-tab`, `competitive-score-tab`, `scenario-panel`)
- [ ] Fusion des sous-onglets redondants en une vue

### Critères d'acceptation
- [ ] Lint couleurs = 0 sur tout `src/` · page lisible clair+sombre
EOF

issue "HD-044 · Recharts sur tokens (charts finance, runway, heatmap)" "P0,design,frontend" "S2 - Persistance & Design" <<'EOF'
**Epic 4** · Estimation: 1 j/2 · Deps: HD-040

- [ ] Supprimer tout `fill`/`stroke` hex dans `finance-charts`, `runway-chart`, consumers de `chart.tsx`, heatmap journal → `hsl(var(--chart-N))` + sémantiques (runway danger = `--danger`)
EOF

issue "HD-045 · Audit contraste AA + passe 16 pages × 2 thèmes" "P0,design,frontend" "S2 - Persistance & Design" <<'EOF'
**Epic 4** · Estimation: 1.5 j/2 · Deps: HD-042, HD-043, HD-044

- [ ] Contrastes AA (4.5:1 texte, 3:1 UI) — petit texte orange → marine
- [ ] Toggle suit `prefers-color-scheme` par défaut, préférence persistée
- [ ] Captures des 16 pages × 2 thèmes archivées dans la PR
EOF

issue "HD-046 · Dosage identité pixel (fonts, sons)" "P1,design,frontend" "S3 - Agents & Onglets" <<'EOF'
**Epic 4** · Estimation: 0.5 j/2 · Deps: —

- [ ] Font pixel/mono restreinte à la gamification + titres gamifiés ; sans-serif ailleurs
- [ ] Sons off par défaut (vérifier `sound-manager`)
EOF

# ============================================================
# EPIC 5 — i18n
# ============================================================

issue "HD-050 · Setup next-intl, EN par défaut" "P0,i18n,frontend,infra" "S2 - Persistance & Design" <<'EOF'
**Epic 5 — i18n** · Estimation: 1.5 j/2 · Deps: — · **À merger tôt: contraint toutes les strings suivantes**

### Tâches
- [ ] Install + config App Router ; `messages/en.json` (source) + `messages/fr.json` ; migration de `translations.ts`
- [ ] Locale: `Accept-Language` au premier passage puis `User.locale` ; middleware compatible Supabase
- [ ] CI: diff clés en/fr → fail si désynchro
EOF

issue "HD-051 · Extraction des strings FR hardcodées (tout src/)" "P0,i18n,frontend" "S2 - Persistance & Design" <<'EOF'
**Epic 5** · Estimation: 4 j/2 (2 jours) · Deps: HD-050 · **1 PR par lot**

### Lots
- [ ] nav/layout → dashboard → chaque onglet → composants partagés → erreurs API (codes d'erreur côté API, libellés côté client) → empty states → toasts
- [ ] Script heuristique de repérage (accents/mots FR dans .tsx)

### Critères d'acceptation
- [ ] Grep heuristique FR sur `src/` (hors `messages/fr.json`, hors quest-engine HD-053) → 0
EOF

issue "HD-052 · Switcher de langue (top-nav + Settings) + persistance" "P0,i18n,frontend" "S2 - Persistance & Design" <<'EOF'
**Epic 5** · Estimation: 0.5 j/2 · Deps: HD-050

- [ ] Icône globe top-nav + section Settings → écrit `User.locale`
- [ ] Emails et brief suivent cette locale
EOF

issue "HD-053 · Gamification + agents bilingues" "P0,i18n,agents" "S2 - Persistance & Design" <<'EOF'
**Epic 5** · Estimation: 1 j/2 · Deps: HD-050

- [ ] Quest-engine/achievements: brancher `title`/`titleFr` (existants) sur la locale
- [ ] Prompts système agents en EN, sortie en `User.locale` (paramètre `locale` d'`AgentContext` existant)
- [ ] Templates emails Resend en/fr
EOF

# ============================================================
# EPIC 6 — AGENTS, ONBOARDING & BRIEF
# ============================================================

issue "HD-060 · Unification taxonomie agents (5 agents)" "P0,agents,backend" "S3 - Agents & Onglets" <<'EOF'
**Epic 6 — Agents** · Estimation: 1.5 j/2 · Deps: —

### Tâches
- [ ] `AgentId` réduit à: `co-founder`, `cfo`, `growth`, `research`, `content`
- [ ] Fusions: founder-coach→co-founder ; cfo-agent(sub)→cfo ; growth+pm(sub)→growth ; research(sub)+routes competitive→research ; content-creator+content(sub)→content
- [ ] relationship-manager → tool `suggest_followups` du co-founder
- [ ] Flag `ENABLE_EXTRA_AGENTS=false` sur legal/recruiting/tech-lead/pmf/canvas-optimizer/launch-strategist
- [ ] `src/lib/ai/agents/README.md` = 5 fiches de cadrage (mission, onglets lus/écrits, tools, garde-fous, modèle défaut)

### Critères d'acceptation
- [ ] UI (agents-widget, PageAgent) liste exactement 5 agents · registry unique
EOF

issue "HD-061 · Garde-fou: confirmation avant toute écriture agent" "P0,agents,backend,frontend" "S3 - Agents & Onglets" <<'EOF'
**Epic 6** · Estimation: 1.5 j/2 · Deps: HD-011

- [ ] `write_dashboard_tab` → mode « proposal »: diff structuré retourné
- [ ] UI: « I'll create: … [Confirm] [Edit] [Cancel] » → confirmation = appel `/api/data/*` (audit trail)

### Critères d'acceptation
- [ ] Aucune écriture BDD par l'agent sans confirmation · le refus n'écrit rien
EOF

issue "HD-062 · Onboarding conversationnel (LA feature du launch)" "P0,agents,frontend,backend" "S3 - Agents & Onglets" <<'EOF'
**Epic 6** · Estimation: 4 j/2 (2 jours) · Deps: HD-035, HD-061, HD-034

### Tâches
- [ ] Trigger `User.onboardedAt IS NULL` → écran plein chat
- [ ] Machine à états 6 questions (projet / stade / objectif 90j / incertitude / temps dispo / modèle de revenus) — clé Helmdash, modèle éco, plafond 15k tokens/user (hard stop en base)
- [ ] Sortie (pipeline proposal, récap unique pré-confirmé): 3-4 sections Lean Canvas + 2 hypothèses + 1 jalon roadmap + `MemoryNote` profil + nœuds graph
- [ ] Récap éditable → « Looks good » → quête « Configure your profile » +10 XP → CTA « Connect your AI » (BYOK)
- [ ] Skippable + rappel sur dashboard vide
- [ ] Coût tracé (HD-104)

### Critères d'acceptation (E2E)
- [ ] Nouveau compte → onboarding → canvas ≥ 40 % + 2 hypothèses visibles + XP crédité
EOF

issue "HD-063 · Panneau mémoire « What I know about you »" "P1,agents,frontend" "S3 - Agents & Onglets" <<'EOF'
**Epic 6** · Estimation: 1 j/2 · Deps: HD-062

- [ ] Panneau latéral page Agent: profil founder + entités graph (lecture)
- [ ] « Forget this » par item (delete MemoryNote/node)
EOF

issue "HD-064 · Paramétrage agents dans Settings + compteur tokens" "P0,agents,frontend" "S3 - Agents & Onglets" <<'EOF'
**Epic 6** · Estimation: 1.5 j/2 · Deps: HD-060, HD-014

- [ ] Par agent: provider (4 adaptateurs), modèle (`model-discovery`), ton, langue de sortie ; défauts + reset
- [ ] Persister `usage` de l'orchestrateur dans `AgentTask` → agrégat tokens/mois par agent affiché
EOF

issue "HD-065 · Brief hebdo: réécriture Prisma + opt-in transparent" "P0,agents,backend" "S3 - Agents & Onglets" <<'EOF'
**Epic 6** · Estimation: 2 j/2 · Deps: HD-030, HD-026

### Tâches
- [ ] Réécrire `api/ai/weekly-report` sur Prisma (supprimer `supabase.from('founder_data')`)
- [ ] Gate `User.weeklyBriefOptIn` (défaut false, proposé à l'onboarding)
- [ ] Structure fixe 5 sections (chiffre semaine / avancées / blocages / 3 priorités avec deep links / nudge quête) ; skip « quiet week »
- [ ] Modèle éco clé Helmdash, langue = locale ; table `WeeklyBrief(userId, generatedAt, content, tokensUsed, model)`
EOF

issue "HD-066 · Brief hebdo: batch cron + livraison (widget + email)" "P0,agents,backend,frontend" "S3 - Agents & Onglets" <<'EOF'
**Epic 6** · Estimation: 1.5 j/2 · Deps: HD-065

- [ ] Cron dimanche 23h → jobs BullMQ par user opt-in → widget dashboard (rebrancher l'existant) + email Resend (en/fr, unsubscribe 1 clic = opt-out)
- [ ] Settings « Weekly Brief »: toggle, jour/heure, canal, texte de transparence (données envoyées, provider, coût pris en charge par Helmdash), historique

### Critères d'acceptation
- [ ] Opt-out → aucun job créé · lien de désinscription fonctionnel
EOF

# ============================================================
# EPIC 7 — ONGLETS
# ============================================================

issue "HD-070 · Dashboard: registry, empty states, suppression Founder Score" "P0,frontend" "S3 - Agents & Onglets" <<'EOF'
**Epic 7 — Onglets** · Estimation: 2 j/2 · Deps: HD-032, HD-042

### Tâches
- [ ] Retirer `founder-score-widget` du registry et partout (décision produit: redondant avec niveau/XP)
- [ ] Ordre par défaut: Brief → Runway → Quêtes → Hypothèses ; drag&drop persisté (préférence UI)
- [ ] Empty state + CTA par widget ; skeletons homogènes
- [ ] Fusion pixel-mood dans widget Journal ; mvp-countdown conditionnel à une date définie

### Critères d'acceptation
- [ ] Dashboard jamais vide à J0 post-onboarding · `grep -r "founder-score" src` → 0
EOF

issue "HD-071 · Page Agent: UX chat complet" "P0,frontend,agents" "S3 - Agents & Onglets" <<'EOF'
**Epic 7** · Estimation: 1.5 j/2 · Deps: HD-035, HD-061

- [ ] Reprise conversation après refresh · stop generation · statut délégation (« Asking CFO agent… »)
- [ ] Erreur BYOK absente/invalide → empty state + CTA Settings · copy sur blocs markdown
EOF

issue "HD-072 · Finances: alertes runway + simulation simple" "P0,frontend" "S3 - Agents & Onglets" <<'EOF'
**Epic 7** · Estimation: 1 j/2 · Deps: HD-032, HD-044

- [ ] Seuils runway <6 mois = `warning`, <3 = `danger` (tokens)
- [ ] Slider de simulation burn/revenus (une seule) · devise EUR unique v1
EOF

issue "HD-073 · Hypothèses: learning obligatoire à la clôture + tri" "P0,frontend" "S3 - Agents & Onglets" <<'EOF'
**Epic 7** · Estimation: 1 j/2 · Deps: HD-032

- [ ] Champ `learning` requis pour clore (validée/invalidée)
- [ ] Tri impact × confiance · propositions agent Growth = drafts à accepter (HD-061)
EOF

issue "HD-074 · Lean Canvas: suggestions par bloc + export PNG/PDF" "P1,frontend,agents" "S3 - Agents & Onglets" <<'EOF'
**Epic 7** · Estimation: 1 j/2 · Deps: HD-032, HD-061

- [ ] Bouton « Suggest » par section (co-founder, confirmation)
- [ ] Export PNG/PDF (jspdf présent) · % complétude branché quêtes (HD-034)
EOF

issue "HD-075 · Roadmap: dnd statuts + dates optionnelles" "P1,frontend" "S3 - Agents & Onglets" <<'EOF'
**Epic 7** · Estimation: 1 j/2 · Deps: HD-032

- [ ] Drag&drop statuts (dnd-kit) · dates nullable · badge retard `warning`
EOF

issue "HD-076 · Routine: timezone user + templates + streaks locaux" "P0,frontend,backend" "S3 - Agents & Onglets" <<'EOF'
**Epic 7** · Estimation: 1 j/2 · Deps: HD-034

- [ ] `User.timezone` (détecté au signup, éditable Settings) · reset streaks à minuit LOCALE
- [ ] 3 templates de routines founder proposés à l'onboarding

### Critères d'acceptation
- [ ] Streak survit au changement d'appareil · reset à minuit locale (test avec TZ mockée)
EOF

issue "HD-077 · Journal: opt-out lecture par l'agent" "P0,frontend,backend" "S3 - Agents & Onglets" <<'EOF'
**Epic 7** · Estimation: 0.5 j/2 · Deps: HD-032

- [ ] Toggle Settings « Agent can read my journal » (défaut on, affiché à l'onboarding)
- [ ] CoreAgent exclut MoodEntry/journal si off · mention sur la page Journal
EOF

issue "HD-078 · Content: garde anti auto-publication + copy par plateforme" "P1,frontend" "S3 - Agents & Onglets" <<'EOF'
**Epic 7** · Estimation: 0.5 j/2 · Deps: HD-032

- [ ] Drafts agents jamais publiés automatiquement (statut `draft` forcé)
- [ ] Copy-to-clipboard par plateforme
EOF

issue "HD-079 · CRM: import + suggestions de relance" "P1,frontend" "S3 - Agents & Onglets" <<'EOF'
**Epic 7** · Estimation: 1 j/2 · Deps: HD-090, HD-060

- [ ] Boutons import CSV/Notion sur la page
- [ ] Tool `suggest_followups` exposé (liste de suggestions, actions manuelles)
EOF

issue "HD-080 · GTM: wizard 5 étapes + draft par agent Growth" "P1,frontend,agents" "S3 - Agents & Onglets" <<'EOF'
**Epic 7** · Estimation: 1.5 j/2 · Deps: HD-032, HD-061

- [ ] Wizard: ICP → canaux → message → jalons → review
- [ ] « Generate draft from my canvas » (agent Growth, confirmation)
EOF

issue "HD-081 · Feature flag onglets beta (Whiteboard, OKR cachés v1)" "P0,frontend" "S3 - Agents & Onglets" <<'EOF'
**Epic 7** · Estimation: 0.5 j/2 · Deps: —

- [ ] `ENABLE_BETA_TABS=false`: retirés de la sidebar + redirect · données conservées en base
EOF

issue "HD-082 · Competitive Watch: vue unifiée + scan à la demande" "P0,frontend,agents" "S3 - Agents & Onglets" <<'EOF'
**Epic 7** · Estimation: 1.5 j/2 · Deps: HD-043, HD-012

- [ ] Une vue unifiée (profils + matrice + signaux) — suppression des sous-onglets redondants
- [ ] Bouton « Scan » (BYOK, agent Research) avec sources citées
- [ ] Suppression de toute mention « automatique »

### Critères d'acceptation
- [ ] Un scan produit un profil sourcé en < 60 s (modèle standard)
EOF

issue "HD-083 · Settings: refonte complète (dont export/delete RGPD)" "P0,frontend,backend,legal" "S3 - Agents & Onglets" <<'EOF'
**Epic 7** · Estimation: 2 j/2 · Deps: HD-014, HD-052, HD-064, HD-066

### Sections
Profile (nom, timezone, locale) / AI & API keys / Agents / Weekly Brief / Billing / Data & Privacy / Appearance

### P0 légal
- [ ] `GET /api/account/export`: zip JSON complet des données Prisma du user
- [ ] `DELETE /api/account`: purge Prisma + Stripe customer + confirmation email + délai de grâce 48h
EOF

# ============================================================
# EPIC 8 — PROGRESSION & QUÊTES
# ============================================================

issue "HD-085 · Refonte page Progression selon maquette (zéro scroll quêtes)" "P0,frontend,design" "S3 - Agents & Onglets" <<'EOF'
**Epic 8 — Progression** · Estimation: 2 j/2 · Deps: HD-034, HD-070

### Layout
- [ ] Header: titre + sous-titre à gauche · **XP card** haut droite (niveau, titre du niveau i18n, XP courant/palier, barre, %)
- [ ] « Active Quests »: `grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4` — **aucun overflow-x, aucun carrousel** · badge compteur
- [ ] Bas de page: Streak compact + grille Achievements (locked en silhouette marine, tooltip condition) + Level Roadmap
- [ ] Founder Score: absent (supprimé HD-070)

### Critères d'acceptation
- [ ] À 1440 px: 4 quêtes intégralement visibles sans scroll dans la section · <1280 px: wrap 2×2
- [ ] Captures 2 thèmes en PR
EOF

issue "HD-086 · Carte quête compacte + cap 4 quêtes actives" "P0,frontend,design" "S3 - Agents & Onglets" <<'EOF'
**Epic 8** · Estimation: 1 j/2 · Deps: HD-085

- [ ] Carte: icône + titre + badge XP outline orange + barre + 3 sous-tâches visibles + « +N more » expand in-place · `min-h` harmonisée
- [ ] Tâches faites: check `--success` + strikethrough (conforme maquette)
- [ ] Cap 4 quêtes actives max dans le quest-engine (suivantes en file « Up next »)
EOF

issue "HD-087 · Toasts achievements sobres + XP realtime" "P1,frontend" "S3 - Agents & Onglets" <<'EOF'
**Epic 8** · Estimation: 0.5 j/2 · Deps: HD-034

- [ ] Toast déblocage sur tokens · XP bar maj sans refresh (polling 30 s v1)
EOF

# ============================================================
# EPIC 9 — INTÉGRATIONS
# ============================================================

issue "HD-090 · Import CSV (finances, contacts) avec mapping assisté" "P0,data,frontend,backend" "S3 - Agents & Onglets" <<'EOF'
**Epic 9 — Intégrations** · Estimation: 2 j/2 · Deps: HD-030

### Tâches
- [ ] Upload → parse → préview 5 lignes → mapping colonnes (selects) → validation Zod par ligne → dédoublonnage → rapport `{ok, rejected:[{line, reason}]}` → `ImportLog`
- [ ] Templates CSV téléchargeables (fr/en)

### Critères d'acceptation
- [ ] CSV 500 lignes dont 10 erreurs → 490 importées, rapport listant les 10
EOF

issue "HD-091 · Intégration Notion: import one-way (OAuth + mapping)" "P0,data,backend,frontend" "S3 - Agents & Onglets" <<'EOF'
**Epic 9** · Estimation: 3 j/2 (1.5 jour) · Deps: HD-030

### Tâches
- [ ] OAuth Notion direct (recommandé vs Composio) · tokens chiffrés serveur
- [ ] Sélecteur de database → mapping propriétés→champs (hypotheses, roadmap, contacts) → import avec `sourceId` Notion
- [ ] Re-import manuel = upsert par sourceId · UI explicite « Manual re-import » (PAS de sync temps réel)
- [ ] Page Settings: statut, dernière sync, disconnect (révocation + purge token)

### Critères d'acceptation
- [ ] Database Notion 50 items → import complet · re-import sans doublons
EOF

issue "HD-092 · Stripe utilisateur: lecture MRR (read-only)" "P1,data,backend" "S3 - Agents & Onglets" <<'EOF'
**Epic 9** · Estimation: 1.5 j/2 · Deps: HD-014, HD-030

- [ ] Saisie clé restreinte read-only dans Settings (chiffrée comme les clés IA)
- [ ] Brancher le cron `stripe-sync` existant → MRR/revenus dans finances (`source:'stripe'`, non éditables)
- [ ] Mention « read-only » UI
EOF

issue "HD-093 · Webhook Composio signé + retrait des surfaces non prêtes" "P0,security,backend" "S3 - Agents & Onglets" <<'EOF'
**Epic 9** · Estimation: 0.5 j/2 · Deps: HD-013

- [ ] Signature vérifiée sur le webhook
- [ ] Toute UI mentionnant Gmail/GCal/publication sociale retirée du produit v1 (flag)
EOF

# ============================================================
# EPIC 10 — LANDING & MARKETING
# ============================================================

issue "HD-100 · Split marketing/app: app.helmdash.app" "P0,infra,frontend" "S4 - Landing & Launch" <<'EOF'
**Epic 10 — Landing** · Estimation: 1 j/2 · Deps: —

- [ ] App sur `app.helmdash.app` (Vercel + Supabase auth redirect URLs + cookies domain)
- [ ] `helmdash.app/` = marketing · redirect des routes app depuis l'apex
EOF

issue "HD-101 · Landing page complète (EN) + audit claims" "P0,frontend" "S4 - Landing & Launch" <<'EOF'
**Epic 10** · Estimation: 4 j/2 (2 jours) · Deps: HD-100, HD-023, HD-027

### Sections
- [ ] Hero + badge compteur cohorte live · Problème · Démo onboarding (GIF) · Product tour (4 modules, screenshots réels) · Gamification · Agents (5 fiches + mention BYOK) · Weekly brief · Pricing cohortes + toggle périodicité + FAQ pricing · FAQ générale · Footer légal

### Audit claims (checklist en PR)
- [ ] Chaque phrase mappée → feature livrée
- [ ] Interdits: SSO, seats, SLA, on-premise, veille automatique, MCP custom, OpenRouter/local, sous-agents illimités
- [ ] Zéro lien `localhost` · CTAs → signup/checkout réels

### Critères d'acceptation
- [ ] Lighthouse mobile ≥ 90 · responsive complet · OG 1200×630 · sitemap + robots
EOF

issue "HD-102 · Page « get notified » pré-launch" "P1,frontend" "S2 - Persistance & Design" <<'EOF'
**Epic 10** · Estimation: 0.5 j/2 · Deps: HD-100

- [ ] Capture email (Resend audience) dès la semaine 2 · remplacée par la landing finale
EOF

issue "HD-103 · Analytics PostHog (cookieless)" "P0,infra,frontend" "S4 - Landing & Launch" <<'EOF'
**Epic 10** · Estimation: 1 j/2 · Deps: —

- [ ] Config cookieless
- [ ] Événements: `view_landing`, `view_pricing`, `click_cta`, `signup`, `onboarding_completed`, `trial_started`, `checkout_completed`, `brief_optin` — segmentés par cohorte
EOF

# ============================================================
# EPIC 11 — QA, LÉGAL, OBSERVABILITÉ
# ============================================================

issue "HD-104 · Dashboard interne coûts IA Helmdash" "P0,infra,backend" "S4 - Landing & Launch" <<'EOF'
**Epic 11 — QA/Ops** · Estimation: 1 j/2 · Deps: HD-062, HD-065

- [ ] Table `AiCostLog(scope: onboarding|brief, userId, tokens, model, costEstimate)`
- [ ] Vue admin (page protégée ou Metabase) · alerte si > seuil/jour
EOF

issue "HD-105 · Tests unitaires noyau (Vitest)" "P0,qa" "S4 - Landing & Launch" <<'EOF'
**Epic 11** · Estimation: 2 j/2 · Deps: modules concernés

- [ ] runway-calculator · xp-table/quest-engine (attribution, idempotence) · validateTabData · encryption roundtrip · assignCohort (race 100/101 via transactions concurrentes)
EOF

issue "HD-106 · Tests d'intégration API" "P0,qa,backend" "S4 - Landing & Launch" <<'EOF'
**Epic 11** · Estimation: 2 j/2 · Deps: HD-030, HD-024

- [ ] DB de test · auth 401 systématique (générée depuis la liste des routes) · isolation A/B sur `/api/data/*` · webhook Stripe signature invalide · import CSV
EOF

issue "HD-107 · E2E Playwright: 6 parcours critiques" "P0,qa,frontend" "S4 - Landing & Launch" <<'EOF'
**Epic 11** · Estimation: 2 j/2 · Deps: HD-062, HD-024, HD-052

- [ ] signup→onboarding→canvas pré-rempli · finance→runway · hypothèse→XP · checkout test→cohorte · switch langue · switch thème
- [ ] CI nightly (pas sur chaque PR)
EOF

issue "HD-108 · Sentry + logs structurés routes IA" "P0,infra,backend" "S4 - Landing & Launch" <<'EOF'
**Epic 11** · Estimation: 1 j/2 · Deps: —

- [ ] Sentry front + API · alerte error rate
- [ ] Logger structuré routes IA (userId, agent, tokens, durée — pas de contenu prompt par défaut) · masquage clés (HD-014)
EOF

issue "HD-109 · Pages légales + consentements (RGPD)" "P0,legal,frontend" "S4 - Landing & Launch" <<'EOF'
**Epic 11** · Estimation: 1.5 j/2 (+ rédaction) · Deps: —

- [ ] Routes `/terms`, `/privacy`, `/legal` (mentions FR: éditeur, hébergeur, SIREN)
- [ ] Sous-traitants listés (Supabase, Vercel, Stripe, Resend, provider IA du brief, Composio)
- [ ] Liens footer app + landing · consentements techniques (brief HD-065, journal HD-077, export/delete HD-083) référencés depuis la Privacy
EOF

issue "HD-110 · Ops pré-launch (backups, monitoring, quotas, runbook)" "P0,infra" "S4 - Landing & Launch" <<'EOF'
**Epic 11** · Estimation: 1 j/2 · Deps: —

- [ ] Backups Supabase vérifiés + 1 test de restore documenté
- [ ] Uptime monitoring + page status
- [ ] Revue quotas Vercel/Upstash/Supabase/provider IA + plafonds de dépense
- [ ] Runbook incident 1 page (rollback Vercel, feature flags)
EOF

issue "HD-111 · Dry run launch + freeze" "P0,qa,infra" "S4 - Landing & Launch" <<'EOF'
**Epic 11** · Estimation: 0.5 j/2 · Deps: tous les P0

- [ ] Parcours complet en prod (compte réel, paiement test puis refund)
- [ ] Checklist go/no-go · freeze deploys J-1 · hotfix branch prête
EOF

echo ""
echo "==> Terminé: $N issues créées sur $REPO"
echo "    Vérifie: gh issue list --repo $REPO --limit 70"
