FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive

# Instalar herramientas esenciales y ttyd
RUN apt-get update && apt-get install -y \
    curl \
    git \
    vim \
    nano \
    ttyd \
    tree \
    && rm -rf /var/lib/apt/lists/*

EXPOSE 7681

WORKDIR /root/workspace
RUN echo "echo '¡Bienvenido(a) a la Sandbox Básica de OnBoardingHub!'" >> /root/.bashrc
RUN echo "echo 'Herramientas disponibles: git, curl, vim, nano, tree'" >> /root/.bashrc

ENTRYPOINT ["ttyd", "-p", "7681", "-W", "bash"]
