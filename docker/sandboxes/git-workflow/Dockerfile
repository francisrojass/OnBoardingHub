FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive

# ── Core tools + jq ─────────────────────────────────────────────────
RUN apt-get update && apt-get install -y \
    curl git vim nano ttyd tree jq \
    && rm -rf /var/lib/apt/lists/*

# ── Git config for the sandbox user ─────────────────────────────────
RUN git config --global user.name "Novato OnBoarding" && \
    git config --global user.email "novato@onboardinghub.dev" && \
    git config --global init.defaultBranch main

# ── Create the "remote" bare repo (simulates origin) ────────────────
RUN mkdir -p /opt/repos/webapp.git && \
    cd /opt/repos/webapp.git && git init --bare

# ── Create and populate the working repo ────────────────────────────
RUN mkdir -p /opt/repos/workspace && \
    cd /opt/repos/workspace && git init && \
    git remote add origin /opt/repos/webapp.git && \
    \
    # Initial commit — existing codebase
    mkdir -p src tests && \
    echo '<!DOCTYPE html>\n<html lang="es">\n<head><meta charset="UTF-8"><title>Webapp Corp</title></head>\n<body>\n  <h1>Bienvenido a Webapp Corp</h1>\n  <p>Version 1.0</p>\n</body>\n</html>' > src/index.html && \
    echo 'body { font-family: Arial, sans-serif; margin: 40px; }\nh1 { color: #333; }' > src/styles.css && \
    echo '// Main app entry\nconsole.log("Webapp Corp v1.0");' > src/app.js && \
    echo '# Webapp Corp\n\nProyecto interno de la empresa.\n\n## Cómo ejecutar\n\n```bash\nopen src/index.html\n```' > README.md && \
    echo 'node_modules/\n.env\n*.log' > .gitignore && \
    git add -A && git commit -m "feat: initial project setup — v1.0" && \
    \
    # Second commit — add some structure
    echo '{\n  "name": "webapp-corp",\n  "version": "1.0.0",\n  "description": "Webapp Corp internal project",\n  "main": "src/app.js"\n}' > package.json && \
    echo '// Utility functions\nfunction formatDate(d) {\n  return d.toISOString().split("T")[0];\n}\nmodule.exports = { formatDate };' > src/utils.js && \
    git add -A && git commit -m "chore: add package.json and utils module" && \
    \
    # Push to "origin"
    git push origin main && \
    \
    # Create a develop branch
    git checkout -b develop && \
    echo '// API client placeholder\nconst API_URL = "https://api.example.com";\n\nasync function fetchData() {\n  console.log("Fetching from", API_URL);\n  // TODO: implement real fetch\n}\n\nmodule.exports = { fetchData };' > src/api.js && \
    git add -A && git commit -m "feat: add api client placeholder" && \
    git push origin develop && \
    git checkout main

# ── Copy the working repo to the user workspace ─────────────────────
RUN rm -rf /root/workspace && \
    cp -r /opt/repos/workspace /root/workspace && \
    cd /root/workspace && \
    git remote set-url origin /opt/repos/webapp.git

# ── Create helper scripts ───────────────────────────────────────────
RUN mkdir -p /opt/scripts

# Script to verify tasks
COPY verify-tasks.sh /opt/scripts/verify-tasks.sh
RUN chmod +x /opt/scripts/verify-tasks.sh

# ── Welcome message (overwrite base image messages) ─────────────────
RUN cp /dev/null /root/.bashrc && \
    echo 'echo ""' >> /root/.bashrc && \
    echo 'echo "╔══════════════════════════════════════════════════════╗"' >> /root/.bashrc && \
    echo 'echo "║  🚀 OnBoardingHub — Git Workflow Sandbox            ║"' >> /root/.bashrc && \
    echo 'echo "║                                                      ║"' >> /root/.bashrc && \
    echo 'echo "║  Practica el flujo Git de la empresa:                ║"' >> /root/.bashrc && \
    echo 'echo "║    • Crear ramas feature                             ║"' >> /root/.bashrc && \
    echo 'echo "║    • Hacer commits atómicos                          ║"' >> /root/.bashrc && \
    echo 'echo "║    • Push y merge a develop                          ║"' >> /root/.bashrc && \
    echo 'echo "║                                                      ║"' >> /root/.bashrc && \
    echo 'echo "║  Escribe: verify  — para comprobar tu progreso       ║"' >> /root/.bashrc && \
    echo 'echo "╚══════════════════════════════════════════════════════╝"' >> /root/.bashrc && \
    echo 'echo ""' >> /root/.bashrc && \
    echo 'alias verify="/opt/scripts/verify-tasks.sh"' >> /root/.bashrc

WORKDIR /root/workspace
EXPOSE 7681

ENTRYPOINT ["ttyd", "-p", "7681", "-W", "bash"]
