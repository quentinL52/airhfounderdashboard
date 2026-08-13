# ============================================================
# GITIGNORE_RULES.md — règles à AJOUTER au .gitignore existant
# (copier le bloc ci-dessous à la fin de .gitignore, puis
#  vérifier avec les commandes en bas de fichier)
# ============================================================

# --- Bloc à copier dans .gitignore ---

# --- Secrets & environnement (jamais versionnés) ---
.env
.env.*
!.env.example
*.pem
*.key
*credentials*.json
*service-account*.json

# --- Artefacts d'agents & d'IDE IA ---
# (worktrees et scratch des agents : Claude/Antigravity/Cursor/Windsurf/IDX)
.claude/
.antigravity/
.cursor/
.windsurf/
.idx/
**/worktrees/
*.agent-scratch*

# --- Logs & sorties de build/debug ---
build_log*.txt
*.log
logs/
audit_report*.txt

# --- Documents stratégiques & internes (ne JAMAIS exposer si le repo repasse public) ---
docs/strategy/
docs/internal/
*strategie*
*veille-strategique*
*improvement-proposal*
notes-privees/

# --- Rapports de tests & couverture ---
coverage/
playwright-report/
test-results/
.nyc_output/

# --- Fichiers systèmes & éditeurs ---
.DS_Store
Thumbs.db
*.swp
.FullName
.modified

# --- Uploads / fixtures volumineuses locales ---
/uploads/
*.local.csv
*.local.xlsx

# --- Fin du bloc ---

# ============================================================
# NOTES IMPORTANTES
# ============================================================
# 1. NE PAS ignorer : scripts/color-baseline.json, scripts/any-baseline.json,
#    docs/claims-register.md, AGENTS.md, PLAN_DEV.md, messages/*.json
#    — ce sont des fichiers de gouvernance VERSIONNÉS volontairement.
#
# 2. .gitignore n'agit pas rétroactivement : si un fichier listé est déjà
#    tracké, le retirer explicitement :
#      git rm --cached <fichier>          # (garde le fichier local)
#      git rm -r --cached .claude/ .idx/  # exemples
#
# 3. Vérifications après ajout :
#      git status --ignored | head -30          # les bons fichiers sont ignorés
#      git ls-files | grep -iE "\.env$|secret|strategie|build_log|\.claude/"   # → vide
#
# 4. Si un secret a déjà été commité par le passé (HERMES_API_KEY,
#    SERVICE_ROLE sur l'historique public) : le .gitignore ne suffit pas —
#    la ROTATION de la clé est la seule vraie protection (déjà demandé,
#    à confirmer fait).
# ============================================================
