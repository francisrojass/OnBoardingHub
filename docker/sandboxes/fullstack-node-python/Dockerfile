FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive

# Instalar ttyd, Python, Node.js y herramientas de Dev
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    git \
    vim \
    nano \
    ttyd \
    tree \
    sqlite3 \
    python3 \
    python3-pip \
    gnupg \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

EXPOSE 7681

WORKDIR /root/workspace
RUN echo "echo '=== Entorno Fullstack Dev: Node.js & Python ==='" >> /root/.bashrc
RUN echo "echo 'Herramientas: node, npm, python3, pip, git, sqlite3'" >> /root/.bashrc
RUN echo "echo 'Usa npm init o python3 -m http.server para empezar.'" >> /root/.bashrc

ENTRYPOINT ["ttyd", "-p", "7681", "-W", "bash"]
