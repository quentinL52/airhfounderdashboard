#!/usr/bin/env bash
# ============================================================
# HELMDASH — audit_mvp.sh
# À exécuter à la racine du repo (main à jour). Lecture seule.
# Usage: bash audit_mvp.sh > audit_report.txt 2>&1
# Puis coller audit_report.txt dans la conversation.
# ============================================================
set +e
section() { echo; echo "############ $1 ############"; }

echo "HELMDASH AUDIT — $(date) — commit: $(git rev-parse --short HEAD) — branche: $(git branch --show-current)"
git status --porcelain | head -5

section "R1 — CONFLIT DE ROUTE /"
ls -la src/app/page.tsx 2>&1
ls -la "src/app/(marketing)/page.tsx" 2>&1
ls -d src/app/%28app%29 2>&1
echo "--- build check (long, ~2min) ---"
npx tsc --noEmit 2>&1 | tail -3

section "R2 — FOUNDER DEAL (attendu: yearly, 5000, max 100, lock)"
grep -n "founder" src/lib/billing/pricing-config.ts | head -10
grep -rn "FounderDealCounter\|founderRank\|priceLockedForever" prisma/schema.prisma | head -5

section "R3 — CI (attendu: pas de continue-on-error, ratchet présent)"
grep -n "continue-on-error" .github/workflows/*.yml
ls -la scripts/color-baseline.json 2>&1
grep -rn "\(text\|bg\|border\)-\(green\|red\|yellow\|purple\|pink\|cyan\|emerald\|violet\|amber\|rose\|indigo\|fuchsia\|lime\|teal\|sky\)-[0-9]" src --include="*.tsx" | wc -l
grep -n "hardcoded-colors\|check-auth\|npm test\|npm run test" .github/workflows/*.yml | head -8

section "R4 — WAITLIST (attendu: confirm/honeypot/position/rate-limit)"
grep -n "confirm\|honeypot\|position\|ratelimit\|rateLimit" src/app/api/waitlist/route.ts src/app/api/waitlist/*/route.ts 2>/dev/null | head -10
grep -n "confirmedAt\|position" prisma/schema.prisma | head -4

section "R5 — ADMIN (attendu: contrôle de rôle dans CHAQUE route)"
find src/app/api/admin -name "route.ts" 2>/dev/null
for f in $(find src/app/api/admin -name "route.ts" 2>/dev/null); do
  echo "--- $f"; grep -c "role\|isAdmin\|ADMIN" "$f"
done
grep -n "role" prisma/schema.prisma | grep -i user | head -3

section "R6 — CLAIMS-REGISTER (attendu: inventaire exhaustif)"
wc -l docs/claims-register.md 2>&1
grep -c "finances\|runway\|hypothes\|canvas\|BYOK\|agents\|export" docs/claims-register.md 2>/dev/null

section "R7 — FLAGS & PAGES (beta tabs, statut, footer)"
grep -rn "ENABLE_BETA_TABS\|okr\|whiteboard" src/components/*sidebar* src/components/*nav* 2>/dev/null | head -5
find src/app -ipath "*status*" -name "page.tsx" | grep -v api | head -3
grep -rn 'href="#"\|localhost' "src/app/(marketing)" --include="*.tsx" 2>/dev/null | wc -l

section "AXE 2 — AGENT CENTRAL : CÂBLAGE"
echo "--- domaines couverts par les tools (attendu: inclut decisions/contacts/inbox/dailyplan)"
grep -n "decisions\|contacts\|inbox\|dailyplan\|daily_plan" src/lib/ai/dashboard-tools.ts 2>/dev/null | head -8
echo "--- pipeline proposal (attendu: présent)"
grep -rn "proposal\|requiresConfirmation\|confirm" src/lib/ai/core-agent.ts | head -5
echo "--- mémoire injectée (attendu: profil onboarding dans le prompt)"
grep -rn "founderProfile\|MemoryNote\|memory" src/lib/ai/core-agent.ts | head -5
echo "--- metering branché sur les routes IA (attendu: AiUsage sur chat/agents)"
grep -rln "AiUsage\|recordUsage\|meterUsage" src/app/api/ai | head -8
echo "--- locale (attendu: sortie en User.locale)"
grep -rn "locale" src/lib/ai/core-agent.ts src/lib/ai/agent-orchestrator.ts 2>/dev/null | head -4
echo "--- historique persisté"
grep -n "Conversation\|Message" prisma/schema.prisma | head -4

section "AXE 3 — TESTS : ÉTAT"
find . -name "*.test.ts" -o -name "*.spec.ts" | grep -v node_modules | wc -l
find . -name "*.test.ts" -o -name "*.spec.ts" | grep -v node_modules | sort
echo "--- E2E"
find . -path "*playwright*" -name "*.spec.ts" | grep -v node_modules | head -12
echo "--- npm test en CI (attendu: non conditionnel)"
grep -n "test" .github/workflows/*.yml | grep -v "#" | head -5

section "AXE 4 — SEO LOCAL (le reste est audité en ligne)"
ls public/robots.txt public/sitemap.xml 2>&1
find src -name "sitemap*" -o -name "robots*" | grep -v node_modules | head -4
grep -rn "noindex" src/app --include="*.tsx" --include="*.ts" | head -6
grep -n "metadata\|openGraph\|twitter" "src/app/(marketing)/page.tsx" src/app/layout.tsx 2>/dev/null | head -8
ls public/llms.txt 2>&1
grep -rn "application/ld+json\|SoftwareApplication\|FAQPage" src/app --include="*.tsx" | head -4

section "SÉCURITÉ — RAPPELS PERMANENTS"
bash scripts/check-auth.sh 2>&1 | tail -3
grep -rn "SERVICE_ROLE" src/app/api --include="*.ts" -l | head -5
echo "(attendu: uniquement cron/purge + account/delete avec justification)"

echo; echo "############ FIN DU RAPPORT ############"