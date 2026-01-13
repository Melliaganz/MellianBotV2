# Étape 1 : Build de l'application
FROM node:20-bookworm-slim AS builder
WORKDIR /app

# Activation de Corepack pour supporter Yarn 4
RUN corepack enable

COPY package.json yarn.lock .yarnrc.yml ./

# Installation des dépendances avec Yarn Berry
RUN yarn install

COPY . .
RUN yarn build

# Étape 2 : Runtime avec Java et Node
FROM node:20-bookworm-slim
WORKDIR /app

# Mise à jour des paquets système pour corriger les vulnérabilités et installation de Java 17
RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get install -y --no-install-recommends openjdk-17-jre-headless && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Copie des fichiers depuis le builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY src/lavalink ./lavalink

EXPOSE 8080

# Commande de démarrage optimisée pour la RAM (256Mo max pour Lavalink)
CMD java -Xmx256M -jar ./lavalink/Lavalink.jar & node dist/index.js
