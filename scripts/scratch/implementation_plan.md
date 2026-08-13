# Chantier W : Competitive Watch Proactive (Veille Concurrentielle)

Ce plan décrit les spécifications et étapes de réalisation pour le **Chantier W**, conformément à `PLAN_DEV.md`.

## Proposed Changes

### 1. Modèle de données & Base de données
#### [MODIFY] [schema.prisma](file:///c:/Users/quent/Documents/Projets/AIRH/Ops/airhfounderdashboard/prisma/schema.prisma)
- Ajouter le modèle `WatchSettings` lié à `User` (1:1) :
  - `id`: UUID
  - `userId`: UUID (unique, FK User)
  - `frequency`: string (`manual` | `weekly` | `biweekly` | `monthly`)
  - `scope`: Json (`{ competitors: string[], queries: string[] }`)
  - `remindersEnabled`: boolean (default `true`)
  - `lastRunAt`: DateTime (nullable)
  - `createdAt`, `updatedAt`

### 2. API & Services Métier
#### [NEW] [route.ts](file:///c:/Users/quent/Documents/Projets/AIRH/Ops/airhfounderdashboard/src/app/api/data/watch-settings/route.ts)
- Route CRUD avec `withAuth` pour lire (GET) et mettre à jour (POST) la configuration de la veille.

#### [NEW] [route.ts](file:///c:/Users/quent/Documents/Projets/AIRH/Ops/airhfounderdashboard/src/app/api/data/watch-scan/route.ts)
- Route pour exécuter une analyse/scan de la concurrence :
  - Exécute le scan web (via Tavily / WebSearch / Research Agent).
  - Effectue le calcul de diff par rapport aux données du scan précédent.
  - Enregistre les nouveaux résultats.
  - Met à jour `lastRunAt` sur `WatchSettings`.

#### [NEW] [watch.service.ts](file:///c:/Users/quent/Documents/Projets/AIRH/Ops/airhfounderdashboard/src/services/watch.service.ts)
- Logique pure de gestion de la veille :
  - `checkWatchReminders(userId)` : Vérifie si `lastRunAt < now - 7 jours`, `remindersEnabled === true`, et `frequency !== 'manual'`.
  - `calculateScanDiff(previousScan, currentScan)` : Calcule les nouveautés, changements et disparitions de signaux concurrentiels.

#### [NEW] [route.ts](file:///c:/Users/quent/Documents/Projets/AIRH/Ops/airhfounderdashboard/src/app/api/cron/watch-reminders/route.ts)
- Cron quotidien (sécurisé via `CRON_SECRET`) qui exécute la vérification des rappels J+7 et crée une notification in-app ou ligne de check-in si nécessaire.

### 3. Interface Utilisateur (UI)
#### [NEW] [watch-settings-card.tsx](file:///c:/Users/quent/Documents/Projets/AIRH/Ops/airhfounderdashboard/src/app/(app)/competitive-watch/components/watch-settings-card.tsx)
- Composant dans la page Veille (`/competitive-watch`) et le Dashboard (onglet Validation) permettant de :
  - Régler la fréquence (Manuelle, Hebdomadaire, Bi-mensuelle, Mensuelle).
  - Gérer la liste des concurrents et requêtes suivies.
  - Activer/désactiver les rappels à 7 jours (`remindersEnabled`).
  - Lancer un scan instantané avec affichage des diffs.

#### [MODIFY] [page.tsx](file:///c:/Users/quent/Documents/Projets/AIRH/Ops/airhfounderdashboard/src/app/(app)/dashboard/page.tsx)
- Remplacer le placeholder de l'onglet **Validation** par le widget de Veille Concurrentielle Proactive.

## Plan de vérification & Tests

### Automated Tests
- [NEW] `src/__tests__/watch-service.test.ts` :
  - Test unitaires de la logique de rappel J+7 (rappel généré une seule fois si `lastRunAt` > 7j, silence si `remindersEnabled=false` ou `frequency='manual'`).
  - Test du calcul de diff entre 2 résultats de scan.

### Manual Verification
- Naviguer vers `/competitive-watch` et configurer le périmètre et la fréquence.
- Déclencher un scan manuel et observer l'enregistrement du diff et la mise à jour de `lastRunAt`.
- Déclencher le cron de rappel via `curl` ou l'API pour valider la génération de notification in-app.
- Vérifier `npx tsc --noEmit` et la CI.
