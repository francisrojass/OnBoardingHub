#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# OnBoardingHub — Git Workflow Task Verifier
# Checks if the user has completed each guided task correctly
# ═══════════════════════════════════════════════════════════════

REPO="/root/workspace"
REMOTE="/opt/repos/webapp.git"

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
CHECK="✅"
CROSS="❌"
ARROW="➡️ "

passed=0
total=6

echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║       📋 Verificación de Tareas — Git Workflow      ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════╝${NC}"
echo ""

# ── Task 1: Created a feature branch ────────────────────────────
echo -e "${YELLOW}Tarea 1: Crear una rama feature/${NC}"
cd "$REPO"
feature_branch=$(git branch --list 'feature/*' | head -1 | tr -d ' *')
if [ -n "$feature_branch" ]; then
  echo -e "  ${CHECK} ${GREEN}Rama encontrada: ${feature_branch}${NC}"
  passed=$((passed + 1))
else
  echo -e "  ${CROSS} ${RED}No se encontró ninguna rama feature/*${NC}"
  echo -e "  ${ARROW} Crea una rama: git checkout -b feature/tu-nombre-de-feature"
fi
echo ""

# ── Task 2: Modified or created a file ──────────────────────────
echo -e "${YELLOW}Tarea 2: Modificar o crear un archivo en src/${NC}"
if [ -n "$feature_branch" ]; then
  cd "$REPO" && git checkout "$feature_branch" 2>/dev/null
  diff_count=$(git diff main --name-only -- src/ 2>/dev/null | wc -l)
  new_files=$(git diff main --diff-filter=A --name-only -- src/ 2>/dev/null | wc -l)
  total_changes=$((diff_count + new_files))
  if [ "$total_changes" -gt 0 ]; then
    echo -e "  ${CHECK} ${GREEN}Cambios detectados en src/ (${total_changes} archivo(s))${NC}"
    passed=$((passed + 1))
  else
    echo -e "  ${CROSS} ${RED}No hay cambios en src/ respecto a main${NC}"
    echo -e "  ${ARROW} Edita un archivo existente o crea uno nuevo en src/"
  fi
else
  echo -e "  ${CROSS} ${RED}Necesitas crear la rama feature/ primero (Tarea 1)${NC}"
fi
echo ""

# ── Task 3: Made at least one commit ────────────────────────────
echo -e "${YELLOW}Tarea 3: Realizar al menos un commit en tu rama${NC}"
if [ -n "$feature_branch" ]; then
  commit_count=$(git log main.."$feature_branch" --oneline 2>/dev/null | wc -l)
  if [ "$commit_count" -gt 0 ]; then
    echo -e "  ${CHECK} ${GREEN}${commit_count} commit(s) encontrados en ${feature_branch}${NC}"
    last_msg=$(git log "$feature_branch" -1 --format='%s' 2>/dev/null)
    echo -e "       Último commit: \"${last_msg}\""
    passed=$((passed + 1))
  else
    echo -e "  ${CROSS} ${RED}No hay commits nuevos en ${feature_branch}${NC}"
    echo -e "  ${ARROW} Haz: git add . && git commit -m 'feat: descripción del cambio'"
  fi
else
  echo -e "  ${CROSS} ${RED}Necesitas crear la rama feature/ primero (Tarea 1)${NC}"
fi
echo ""

# ── Task 4: Push the feature branch to origin ───────────────────
echo -e "${YELLOW}Tarea 4: Hacer push de tu rama al origin${NC}"
if [ -n "$feature_branch" ]; then
  remote_branch=$(git ls-remote --heads origin "$feature_branch" 2>/dev/null | wc -l)
  if [ "$remote_branch" -gt 0 ]; then
    echo -e "  ${CHECK} ${GREEN}Rama ${feature_branch} encontrada en origin${NC}"
    passed=$((passed + 1))
  else
    echo -e "  ${CROSS} ${RED}La rama no está en origin${NC}"
    echo -e "  ${ARROW} Haz: git push origin ${feature_branch}"
  fi
else
  echo -e "  ${CROSS} ${RED}Necesitas crear la rama feature/ primero (Tarea 1)${NC}"
fi
echo ""

# ── Task 5: Merge into develop ──────────────────────────────────
echo -e "${YELLOW}Tarea 5: Hacer merge de tu feature en develop${NC}"
if [ -n "$feature_branch" ]; then
  cd "$REPO"
  # Check if develop contains the feature branch commits
  git checkout develop 2>/dev/null
  is_merged=$(git log --oneline develop 2>/dev/null | grep -c "$(git log "$feature_branch" -1 --format='%h' 2>/dev/null)")
  merge_commit=$(git log develop --oneline --merges 2>/dev/null | head -3 | grep -ci "feature")
  
  # Alternative: check if feature is ancestor of develop
  git merge-base --is-ancestor "$feature_branch" develop 2>/dev/null
  ancestor_check=$?
  
  if [ "$ancestor_check" -eq 0 ]; then
    echo -e "  ${CHECK} ${GREEN}Feature mergeada en develop correctamente${NC}"
    passed=$((passed + 1))
  else
    echo -e "  ${CROSS} ${RED}La feature aún no está mergeada en develop${NC}"
    echo -e "  ${ARROW} Haz: git checkout develop && git merge ${feature_branch}"
  fi
  git checkout "$feature_branch" 2>/dev/null
else
  echo -e "  ${CROSS} ${RED}Necesitas crear la rama feature/ primero (Tarea 1)${NC}"
fi
echo ""

# ── Task 6: Push develop to origin ──────────────────────────────
echo -e "${YELLOW}Tarea 6: Push de develop actualizado a origin${NC}"
if [ -n "$feature_branch" ]; then
  cd "$REPO"
  local_dev=$(git rev-parse develop 2>/dev/null)
  remote_dev=$(git ls-remote origin develop 2>/dev/null | awk '{print $1}')
  if [ -n "$remote_dev" ] && [ "$local_dev" = "$remote_dev" ]; then
    echo -e "  ${CHECK} ${GREEN}develop actualizado en origin${NC}"
    passed=$((passed + 1))
  else
    echo -e "  ${CROSS} ${RED}develop local y origin no coinciden${NC}"
    echo -e "  ${ARROW} Haz: git checkout develop && git push origin develop"
  fi
else
  echo -e "  ${CROSS} ${RED}Necesitas completar las tareas previas${NC}"
fi
echo ""

# ── Summary ─────────────────────────────────────────────────────
echo -e "${CYAN}══════════════════════════════════════════════════════${NC}"
if [ "$passed" -eq "$total" ]; then
  echo -e "  🎉 ${GREEN}¡TODAS LAS TAREAS COMPLETADAS! ${passed}/${total}${NC}"
  echo -e "  ${GREEN}Has dominado el flujo Git de la empresa.${NC}"
  echo -e "  ${GREEN}XP ganado: +250 XP${NC}"
else
  echo -e "  📊 Progreso: ${YELLOW}${passed}/${total} tareas completadas${NC}"
  echo -e "  Sigue las indicaciones ${ARROW} de arriba para avanzar."
fi
echo -e "${CYAN}══════════════════════════════════════════════════════${NC}"
echo ""
