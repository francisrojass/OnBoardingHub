#!/bin/bash

BASE_DIR="/home/francis/workspace/OnBoardingHub"

echo "1/3 - Abriendo terminal para Docker..."
gnome-terminal --working-directory="$BASE_DIR" -- bash -ic "docker compose up -d && docker compose ps; exec bash" &

echo "Esperando 15 segundos para que Docker levante todo..."
sleep 4 

echo "2/3 - Abriendo terminal para el Servidor..."
gnome-terminal --working-directory="$BASE_DIR/server" -- bash -ic "npm run dev; exec bash" &

echo "Esperando 5 segundos antes de iniciar el cliente..."
sleep 3

echo "3/3 - Abriendo terminal para el Cliente..."
gnome-terminal --working-directory="$BASE_DIR/client" -- bash -ic "npm run dev; exec bash" &

echo "¡Secuencia de inicio completada!"