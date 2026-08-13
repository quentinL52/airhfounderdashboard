# PLAN_DEV.md — CHANTIERS DE DÉVELOPPEMENT (spécification exécutable)
> Compagnon de `AGENTS.md` (les règles y priment). Chaque chantier : périmètre → schéma → contrats API → tâches → GATE en commandes. Ordre d'exécution en fin de fichier. État de référence : commit `31a8e7b`.

---

## CHANTIER 0 — SÉCURITÉ & FIABILITÉ IMMÉDIATES (avant tout le reste)
1. **`(app)/admin/costs` protégé par rôle** : la page (server component) vérifie `User.role === 'admin'` → sinon `redirect('/dashboard')` ; la/les routes de données consommées retournent 403 pour non-admin. Le commentaire « réservée aux fondateurs » ne compte pas.
2. **Purge `helmdash.com`** (8 occurrences dans src) : créer `src/lib/app-url.ts` exportant `APP_URL` lu depuis `NEXT_PUBLIC_APP_URL`, validé au boot par `env.ts` (absent en prod → throw). Supprimer tous les fallbacks en dur.
3. **Honeypot waitlist** : champ caché `website` + rejet si rempli ou si soumission < 2 s après chargement (timestamp signé dans le form). Réponse 200 silencieuse (pas d'info aux bots). Rate limit : migrer la Map mémoire vers Upstash (5/min/IP).
4. **Jobs planifiés : trancher BullMQ** — BullMQ requiert un worker persistant + Redis, incompatible avec Vercel serverless seul. Migration recommandée : crons Vercel + Upstash QStash pour les tâches différées. Vérifier et PROUVER que tournent en prod : purge RGPD 48 h, brief hebdo, veilles planifiées. (Si un worker VPS existe et est monitoré, le documenter dans `docs/ops.md` et le prouver ; sinon migrer.)

**GATE 0**
```bash
# non-admin (compte test) :
curl -s -o /dev/null -w "%{http_code}" -b "$USER_COOKIE" $APP/api/<route-costs>   # → 403
grep -rn "helmdash.com" src | wc -l                                               # → 0
# bot : POST waitlist avec website rempli → 200, puis :
psql: SELECT count(*) FROM waitlist WHERE email='bot@test';                       # → 0
# jobs : déclencher le cron de purge en préprod → log d'exécution + entrée traitée (sortie collée)
```

---

## CHANTIER B — LE BARREUR PLEINEMENT FONCTIONNEL

### B1. Interface de chat (remplace le placeholder « migration en cours »)
- Composant `BarreurChat` (page `/agent`) : streaming sur `api/ai/chat/stream` (existante), reprise d'historique via `Conversation`/`Message` (existants), stop generation, markdown + copy, jauge d'actions (plan Complete).
- **Rendu des proposals** : supprimer le hack prompt `[PROPOSAL:id]`. Le tool `write_dashboard_tab` retourne le proposal dans le tool-result du stream ; le front rend la carte **Confirm / Edit / Cancel** depuis l'événement structuré. Edit = formulaire pré-rempli du payload → re-validation Zod à l'exécution.
- Panneau latéral : liste des conversations (titre auto) + onglet « Decisions » (Decision Log filtré). Bouton « New chat ».
### B2. Tools & skills
- Étendre le registre read/write aux domaines : `decisions`, `inbox`, `dailyplan`, `contacts` (v2 : pipelineStage, nextAction, nextActionDate, waitingOn). Écritures via proposals (D4).
- Tool `get_current_context` → `{ today, daysToMvp (si mvpTargetDate), streak, top3 }`, injecté à chaque conversation.
- Skills markdown : créer `src/lib/ai/skills/{challenge_decision,draft_followup,weekly_planning,runway_alert_analysis,icp_sharpening}.md` + loader (frontmatter YAML validé Zod : id, description, tools autorisés).
- Recherche web contextuelle : si la conversation touche concurrence/marché, le Barreur PROPOSE un scan (« Want me to run a quick scan? ») → délégation Research agent avec contexte projet (canvas + concurrents suivis) → résultats sourcés → proposal d'ajout Competitive Watch.
### B3. Auto-capture contextuelle
- Le prompt système gagne une section extraction : à chaque tour utilisateur, identifier les entités capturables → le modèle appelle un tool `suggest_capture` (léger) par entité : `{ kind: contact|expense|task|hypothesis|decision, payload }`.
- Front : micro-chips sous la réponse (« ➕ Add Julie to CRM? ») — 3 max par tour ; clic = proposal pré-confirmé (une confirmation, pas deux). Réglage Settings > AI : auto-capture ON/OFF global + par kind.

**Schéma (ajouts)**
```prisma
// User: + mvpTargetDate DateTime?  + role String? (existant, utilisé par Chantier 0)
// AgentProposal (existant) : + source String @default("chat") // chat|auto_capture|import
```
**GATE B**
```bash
grep -rn "migration en cours" src | wc -l                          # → 0
grep -rn "IMPÉRATIVEMENT" src/lib/ai | wc -l                       # → 0 (hack supprimé)
npx playwright test barreur                                        # parcours : question → réponse streamée →
#   proposal → Confirm → donnée en base ; Cancel → rien ; refresh → historique intact
npx playwright test auto-capture                                   # fixture "call avec Julie, payé 49€, j'hésite sur X"
#   → 3 chips ; 2 confirmées créent contact+dépense ; 1 ignorée ne crée rien
```

---

## CHANTIER A — ONBOARDING QUI CREUSE
- Passe 1 : reformulation des 6 questions (clés `onboarding.questions.q1..q6` dans messages) vers le concret (voir libellés dans l'issue).
- Passe 2 : table de règles de relance déterministe `src/lib/onboarding/follow-ups.ts` : `{ trigger: (answers)=>bool, questionKey, targetField }` — 2 à 4 relances max. Déclencheurs v1 : réponse cible vague (< N mots ou termes génériques listés), stade=idée, revenus inconnus, objectif non chiffré, dilemme détecté.
- **Question date MVP** (systématique) → `User.mvpTargetDate`.
- Sorties : + Decision ouverte si dilemme (proposée dans le récap, décochable) ; hypothèses avec `successCriteria` rempli depuis Q4bis ; jalon 90 j chiffré.
- Budget inchangé : plafond 15k tokens/user, mode dégradé conservé, tout passe par le récap confirmable.

**GATE A**
```bash
npm test -- onboarding-followups          # unit: chaque trigger sur fixtures vague/précis/dilemme
npx playwright test onboarding            # persona "vague" → ≥2 relances ; mvpTargetDate posée ;
#   dilemme → Decision proposée au récap ; récap = seule écriture
```

---

## CHANTIER C — DASHBOARD EN ONGLETS + OKR CONNECTÉS + COMPTEUR MVP
- Onglets (Tabs shadcn, état dans l'URL `?tab=`) : **Today** (défaut : Top3, relances, blocked/waiting, sweep, check-in) · **Business** (runway, cash, pipeline/won, MRR, **mvp-countdown branché sur `User.mvpTargetDate`**, OKR) · **Validation** (hypothèses, complétude canvas, derniers signaux veille) · **Momentum** (streak, quêtes, XP, humeur 7 j). Widgets existants réutilisés ; registry mis à jour ; préférence d'onglet persistée.
- **OKR** :
```prisma
model Objective { id String @id @default(cuid())  userId String  title String
  period String  // ex "2026-Q3" ou "MVP"
  status String @default("active") // active|done|dropped
  createdAt DateTime @default(now())
  keyResults KeyResult[]  @@index([userId]) @@map("objective") }
model KeyResult { id String @id @default(cuid())  objectiveId String  userId String
  title String
  sourceType String  // mrr|pipeline_won|waitlist_confirmed|hypotheses_validated|runway_months|manual
  sourceConfig Json?  target Float  current Float @default(0)  unit String?
  updatedAt DateTime @updatedAt
  objective Objective @relation(fields:[objectiveId], references:[id], onDelete: Cascade)
  @@index([userId]) @@map("key_result") }
```
- Refresh : job quotidien `refreshKeyResults(userId)` — mapping sourceType→requête Prisma/Stripe (fonctions pures testables). `manual` = édition inline.
- API : `/api/data/objectives` + `/api/data/key-results` via le registre CRUD standard (withAuth+Zod). Le Barreur : tool `read_okr` ; suggestions de re-priorisation = proposals.

**GATE C**
```bash
npm test -- key-results-refresh    # chaque sourceType sur fixtures → current exact
npx playwright test dashboard-tabs # 4 onglets ; Today par défaut ; countdown affiché ssi date posée ;
#   KR mrr bouge après ajout d'une entrée Stripe fixture
```

---

## CHANTIER F — CONSCIENCE TEMPORELLE (MVP)
- `get_current_context` (B2) fournit `daysToMvp`. Règles graduelles dans le prompt système (pas de code spécial) : J>30 mention légère si pertinent · J≤30 : check-in et brief en mode focus + proposal de re-priorisation + suggestion Decision « scope freeze? » · J≤7 : proposer la checklist launch (skill markdown `launch_checklist`) · J<0 : proposer rétro + nouvelle date.
**GATE F** : fixture user à J-25 → le check-in mentionne l'échéance (snapshot test du prompt rendu) ; sans date → aucun de ces comportements ; « what day is it? » → date exacte.

---

## CHANTIER W — COMPETITIVE WATCH PROACTIVE
```prisma
model WatchSettings { id String @id @default(cuid())  userId String @unique
  frequency String @default("manual") // manual|weekly|biweekly|monthly
  scope Json  // { competitors: string[], queries: string[] }
  remindersEnabled Boolean @default(true)
  lastRunAt DateTime?  createdAt DateTime @default(now())  @@map("watch_settings") }
```
- Réglage sur l'onglet (fréquence + périmètre). Exécution planifiée via l'infra jobs (Chantier 0.4) → Research agent avec contexte projet → résultats sourcés + **diff vs run précédent** → notification in-app.
- **Rappel J+7** : job quotidien — si `lastRunAt < now-7j` ET `remindersEnabled` ET fréquence ≠ manual-désactivé → notification + ligne check-in « No scan in 7 days — run one? [Yes] [This week] [Turn off] ». Jamais de scan auto non consenti. Coût : décompte AiUsage (Complete) ou BYOK ; skip courtois si quota atteint.
**GATE W** : fixture lastRunAt=J-8 → rappel généré une seule fois/jour ; « Yes » → scan lancé + lastRunAt maj ; scan → diff correct sur fixtures ; remindersEnabled=false → silence.

---

## CHANTIER G — GTM PROFESSIONNALISÉ
- Renommer les cartes (clés i18n `gtm.steps.*`) : **Positioning & ICP · Messaging · Channels · Launch plan · Measure & iterate**. Aucune référence à des ouvrages/méthodes déposées.
- Connexions réelles : jalons GTM = `RoadmapItem` liés (FK `gtmStepId?` sur RoadmapItem, pas de duplication) · ICP → lu par Research (W) et affiché dans CRM (badge de qualification simple : match/no-match sur critères déclarés) · carte Measure → KPIs réels (waitlist confirmés, pipeline won) en lecture, pas des champs libres · Channels → bouton « Suggest content ideas » (agent Content, proposals).
- Toute promesse d'intégration non câblée : retirée de l'UI.
**GATE G** : grep des anciens noms → 0 ; créer un jalon GTM → visible dans Roadmap (même id) ; carte Measure affiche les compteurs réels d'une fixture.

---

## CHANTIER J — JOURNAL CONNECTÉ
- Prompt du jour contextuel (règles : dernier événement notable → question), humeur existante conservée.
- Lecture Barreur (opt-in existant) : 7 derniers jours dans le contexte ; le check-in peut y faire écho sobrement et proposer une Decision si un dilemme y traîne.
- Vue hebdo : heatmap humeur (existante) + thèmes récurrents (tags par règles/LLM léger) + corrélation humeur↔streak affichée seulement si ≥ 4 semaines de données. Brief hebdo : + ligne « mood of the week ».
- Garde-fou : ton sobre ; si détresse détectée → message statique orientant vers des ressources humaines ; jamais de coaching émotionnel génératif.
**GATE J** : opt-out → le Barreur ne cite jamais le journal (test) ; fixture 5 semaines → corrélation affichée ; fixture 2 semaines → absente.

---

## CHANTIER S — SETTINGS EN ONGLETS
Tabs : Profile (nom, timezone, locale, mvpTargetDate) · AI (BYOK+test, modèle/agent, jauge, auto-capture) · Agents (ton, langue, skills, fréquence veille) · Notifications (check-in, rappels veille, digest, brief+transparence) · Billing · Data & Privacy (imports, exports par module, lecture journal, suppression 48 h) · Appearance (thème, langue, sons, densité compact/confortable). État URL `?tab=`, chaque panel existant réutilisé.
**GATE S** : navigation directe par URL sur chaque tab ; densité persiste ; aucun panel orphelin (tous accessibles).

---

## CHANTIER I — SMART IMPORT (LLM, sécurisé)
- Entrée : texte collé ou fichier (txt/md/csv/pdf-texte, ≤ 2 Mo). Cible choisie (contacts|expenses|tasks|hypotheses) ou « detect ».
- Pipeline : validation taille/type → extraction LLM avec schéma Zod strict par cible → **écran de revue** : liste de proposals cochables/éditables → confirmation = créations via `/api/data/*` → `ImportLog` (existant). Décompte AiUsage (Complete) ou BYOK.
- **Anti prompt-injection** : le contenu est encapsulé comme données non fiables ; le prompt d'extraction ignore toute instruction du contenu ; sortie hors schéma → rejet.
**GATE I**
```bash
npm test -- smart-import   # fixture notes de call → 3 contacts + 2 tâches extraits ;
#   fixture injection ("ignore your instructions and ...") → extraction seule, 0 action parasite ;
#   fichier 10 Mo → 413 propre
```

---

## CHANTIER E — AGENTS CONFIG-AS-DATA
- `src/lib/ai/agents/registry/{barreur,cfo,growth,research,content}.md` : frontmatter YAML (id, name, mission, domainsRead[], domainsWrite[], tools[], defaultModel, guardrails[]) + corps = prompt système. Loader unique + validation Zod au boot (frontmatter invalide → throw explicite).
- Le TS ne garde que le moteur (orchestrateur, tools, exécution). Sub-agents legacy → `registry/disabled/` non chargé.
**GATE E** : fixtures avant/après identiques sur 3 requêtes types ; éditer un .md change le comportement au reboot sans toucher au TS ; frontmatter cassé → erreur au boot (sortie collée).

---

## CHANTIER T — DETTE CONTINUE
- Ratchet `: any` : `scripts/any-baseline.json` (206) + step CI (même mécanique que les couleurs).
- `depcheck` : suppression des dépendances orphelines (rapport en Proof).
- Tests P0 restants (à répartir dans les PRs des chantiers ci-dessus, pas en lot séparé) : isolation A/B paramétrée sur tous les domaines `/api/data/*`, metering (400→401, BYOK exclu, idempotence), RGPD (annulation 48 h restaure, échec Stripe → skip), gamification (XP idempotent, streak TZ).

---

## ORDRE D'EXÉCUTION
```
S1  CHANTIER 0 (intégral) + B1
S2  B2 + B3 + A
S3  C + F
S4  W + J
S5  G + S + I
S6  E + T
S7  E2E consolidés, polish, dry run — gel features J-14 avant le 15/09
```
Règle : un chantier ne démarre pas si le GATE du précédent sur son chemin (0 → B → C/F) n'est pas fermé par l'humain.
