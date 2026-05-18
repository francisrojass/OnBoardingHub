#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# OnBoardingHub — UML Designer Task Verifier
# Checks if the user has completed the UML design exercise
# ═══════════════════════════════════════════════════════════════

REPO="/root/workspace/library-model"
MODELS_DIR="$REPO/Models"

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'
CHECK="✅"
CROSS="❌"
ARROW="➡️ "

passed=0
total=5

echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║   📋 Verificación de Tareas — UML Designer         ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════╝${NC}"
echo ""

# ── Task 1: Models directory has .cs files ──────────────────────
echo -e "${YELLOW}Tarea 1: Generar archivos de código C#${NC}"
if [ -d "$MODELS_DIR" ]; then
  cs_count=$(find "$MODELS_DIR" -name "*.cs" | wc -l)
  if [ "$cs_count" -ge 1 ]; then
    echo -e "  ${CHECK} ${GREEN}${cs_count} archivo(s) .cs encontrados en Models/${NC}"
    passed=$((passed + 1))
  else
    echo -e "  ${CROSS} ${RED}No hay archivos .cs en Models/${NC}"
    echo -e "  ${ARROW} Usa el botón 'Generar C#' y luego 'Copiar al proyecto'"
  fi
else
  echo -e "  ${CROSS} ${RED}El directorio Models/ no existe${NC}"
  echo -e "  ${ARROW} Usa el botón 'Copiar al proyecto' para crear los archivos"
fi
echo ""

# ── Task 2: At least 3 classes defined ──────────────────────────
echo -e "${YELLOW}Tarea 2: Definir al menos 3 clases${NC}"
if [ -d "$MODELS_DIR" ]; then
  class_count=$(grep -r "public class" "$MODELS_DIR" 2>/dev/null | sort -u | wc -l)
  if [ "$class_count" -ge 3 ]; then
    echo -e "  ${CHECK} ${GREEN}${class_count} clases encontradas${NC}"
    grep -rh "public class" "$MODELS_DIR" 2>/dev/null | sort -u | while read line; do
      classname=$(echo "$line" | sed 's/.*public class \([^ {]*\).*/\1/')
      echo -e "       • ${classname}"
    done
    passed=$((passed + 1))
  else
    echo -e "  ${CROSS} ${RED}Solo ${class_count} clase(s) encontrada(s) (mínimo 3)${NC}"
    echo -e "  ${ARROW} Crea las clases Book, Author y Library en el editor UML"
  fi
else
  echo -e "  ${CROSS} ${RED}Directorio Models/ no encontrado${NC}"
fi
echo ""

# ── Task 3: Classes have properties ────────────────────────────
echo -e "${YELLOW}Tarea 3: Las clases deben tener atributos (propiedades)${NC}"
if [ -d "$MODELS_DIR" ]; then
  prop_count=$(grep -r "{ get; set; }" "$MODELS_DIR" 2>/dev/null | wc -l)
  if [ "$prop_count" -ge 3 ]; then
    echo -e "  ${CHECK} ${GREEN}${prop_count} propiedades encontradas en total${NC}"
    passed=$((passed + 1))
  else
    echo -e "  ${CROSS} ${RED}Solo ${prop_count} propiedad(es) encontrada(s) (mínimo 3)${NC}"
    echo -e "  ${ARROW} Añade atributos a tus clases (Title, Name, ISBN, etc.)"
  fi
else
  echo -e "  ${CROSS} ${RED}Directorio Models/ no encontrado${NC}"
fi
echo ""

# ── Task 4: Git commit exists ───────────────────────────────────
echo -e "${YELLOW}Tarea 4: Hacer commit del código generado${NC}"
cd "$REPO" 2>/dev/null
if [ -d "$REPO/.git" ]; then
  commit_count=$(git log --oneline 2>/dev/null | wc -l)
  if [ "$commit_count" -ge 1 ]; then
    last_msg=$(git log -1 --format='%s' 2>/dev/null)
    echo -e "  ${CHECK} ${GREEN}${commit_count} commit(s) en el repositorio${NC}"
    echo -e "       Último: \"${last_msg}\""
    passed=$((passed + 1))
  else
    echo -e "  ${CROSS} ${RED}No hay commits en el repositorio${NC}"
    echo -e "  ${ARROW} Haz: cd ~/workspace/library-model && git add . && git commit -m 'feat: add domain model classes'"
  fi
else
  echo -e "  ${CROSS} ${RED}No es un repositorio Git${NC}"
  echo -e "  ${ARROW} El repositorio debería estar inicializado automáticamente"
fi
echo ""

# ── Task 5: Push to origin ──────────────────────────────────────
echo -e "${YELLOW}Tarea 5: Push del código a origin${NC}"
cd "$REPO" 2>/dev/null
if [ -d "$REPO/.git" ]; then
  local_head=$(git rev-parse HEAD 2>/dev/null)
  remote_head=$(git ls-remote origin main 2>/dev/null | awk '{print $1}')
  if [ -n "$remote_head" ] && [ "$local_head" = "$remote_head" ]; then
    echo -e "  ${CHECK} ${GREEN}Push realizado correctamente a origin/main${NC}"
    passed=$((passed + 1))
  else
    echo -e "  ${CROSS} ${RED}No se ha hecho push o no está sincronizado${NC}"
    echo -e "  ${ARROW} Haz: git push origin main"
  fi
else
  echo -e "  ${CROSS} ${RED}No es un repositorio Git${NC}"
fi
echo ""

# ── Summary ─────────────────────────────────────────────────────
echo -e "${CYAN}══════════════════════════════════════════════════════${NC}"
if [ "$passed" -eq "$total" ]; then
  echo -e "  🎉 ${GREEN}¡TODAS LAS TAREAS COMPLETADAS! (${passed}/${total})${NC}"
  echo -e "  ${GREEN}Has aprendido a diseñar UML y generar código C#${NC}"
  echo ""
  echo -e "  ${CYAN}Ganancia: +200 XP${NC}"
else
  echo -e "  📊 Progreso: ${YELLOW}${passed}/${total} tareas completadas${NC}"
  echo ""
  echo -e "  ${ARROW} Completa las tareas pendientes y ejecuta este script de nuevo"
fi
echo -e "${CYAN}══════════════════════════════════════════════════════${NC}"
echo ""

exit 0
