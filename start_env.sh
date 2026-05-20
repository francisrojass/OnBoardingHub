#!/bin/bash

# Autodetecta la ruta donde está guardado este script
BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "1/3 - Abriendo terminal para Docker..."
wt.exe new-tab --title "Docker" wsl.exe -- bash -ic "cd $BASE_DIR && docker compose up -d && docker compose ps \; exec bash"

echo "Esperando 15 segundos para que Docker levante todo..."
sleep 15

echo "2/3 - Abriendo terminal para el Servidor..."
wt.exe new-tab --title "Servidor" wsl.exe -- bash -ic "cd $BASE_DIR/server && npm run dev \; exec bash"

echo "Esperando 5 segundos antes de iniciar el cliente..."
sleep 5

echo "3/3 - Abriendo terminal para el Cliente..."
wt.exe new-tab --title "Cliente" wsl.exe -- bash -ic "cd $BASE_DIR/client && npm run dev \; exec bash"

echo "¡Secuencia de inicio completada!"