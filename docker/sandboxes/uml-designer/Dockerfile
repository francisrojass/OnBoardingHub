FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive

# ── Core tools ──────────────────────────────────────────────────────
RUN apt-get -o Acquire::AllowInsecureRepositories=true \
        -o Acquire::AllowDowngradeToInsecureRepositories=true update \
    && apt-get install -y --allow-unauthenticated \
    curl git vim nano tree jq nodejs npm \
    && rm -rf /var/lib/apt/lists/*

# ── Install ttyd for web terminal ───────────────────────────────────
RUN curl -sL https://github.com/tsl0922/ttyd/releases/download/1.7.7/ttyd.x86_64 -o /usr/local/bin/ttyd \
    && chmod +x /usr/local/bin/ttyd

# ── Git config ──────────────────────────────────────────────────────
RUN git config --global user.name "Novato OnBoarding" && \
    git config --global user.email "novato@onboardinghub.dev" && \
    git config --global init.defaultBranch main

# ── Create the "remote" bare repo (simulates origin) ────────────────
RUN mkdir -p /opt/repos/library-model.git && \
    cd /opt/repos/library-model.git && git init --bare

# ── Create the working repo ─────────────────────────────────────────
RUN mkdir -p /root/workspace/library-model && \
    cd /root/workspace/library-model && git init && \
    git remote add origin /opt/repos/library-model.git && \
    mkdir -p Models && \
    printf '# Library Model — Proyecto de Diseño UML\n\nEste repositorio contiene el modelo de dominio generado\ndesde el editor UML de OnBoardingHub.\n\n## Estructura\n\n```\nModels/\n  Book.cs\n  Author.cs\n  Library.cs\n```\n\n## Instrucciones\n\n1. Diseña las clases en el panel UML (izquierda)\n2. Genera el código C# con el botón ⚡\n3. Copia al proyecto con el botón 📋\n4. Haz commit y push desde la terminal\n' > README.md && \
    printf '<Project Sdk="Microsoft.NET.Sdk">\n  <PropertyGroup>\n    <TargetFramework>net8.0</TargetFramework>\n    <RootNamespace>LibraryModel</RootNamespace>\n  </PropertyGroup>\n</Project>\n' > LibraryModel.csproj && \
    git add -A && git commit -m "chore: initial project structure" && \
    git push origin main

# ── Copy UML app ────────────────────────────────────────────────────
COPY index.html /opt/uml-app/index.html
COPY server.js /opt/uml-app/server.js

# ── Copy verify script ──────────────────────────────────────────────
COPY verify-tasks.sh /root/verify-tasks.sh
RUN chmod +x /root/verify-tasks.sh

# ── Startup script (runs both web UI and terminal) ──────────────────
RUN printf '#!/bin/bash\n\n# Start UML web server in background\ncd /opt/uml-app && node server.js &\n\n# Start ttyd terminal on port 7681\nttyd -p 7681 -W bash &\n\n# Wait for any process to exit\nwait -n\nexit $?\n' > /root/start.sh && \
    chmod +x /root/start.sh

# ── Welcome message and aliases ─────────────────────────────────────
RUN cp /dev/null /root/.bashrc && \
    echo 'echo ""' >> /root/.bashrc && \
    echo 'echo "╔══════════════════════════════════════════════════════╗"' >> /root/.bashrc && \
    echo 'echo "║  🏗️  OnBoardingHub — UML Designer Sandbox           ║"' >> /root/.bashrc && \
    echo 'echo "║                                                      ║"' >> /root/.bashrc && \
    echo 'echo "║  Diseña clases UML en el panel izquierdo y genera   ║"' >> /root/.bashrc && \
    echo 'echo "║  código C# para integrar en este repositorio.        ║"' >> /root/.bashrc && \
    echo 'echo "║                                                      ║"' >> /root/.bashrc && \
    echo 'echo "║  Comandos útiles:                                    ║"' >> /root/.bashrc && \
    echo 'echo "║    verify  — comprobar tu progreso                   ║"' >> /root/.bashrc && \
    echo 'echo "║    cd ~/workspace/library-model                      ║"' >> /root/.bashrc && \
    echo 'echo "║    git status / git add . / git commit / git push    ║"' >> /root/.bashrc && \
    echo 'echo "╚══════════════════════════════════════════════════════╝"' >> /root/.bashrc && \
    echo 'echo ""' >> /root/.bashrc && \
    echo 'alias verify="/root/verify-tasks.sh"' >> /root/.bashrc && \
    echo 'cd /root/workspace/library-model' >> /root/.bashrc

WORKDIR /root/workspace/library-model
EXPOSE 8080 7681

ENTRYPOINT ["/root/start.sh"]
