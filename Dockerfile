# Étape 1 : Build
FROM node:20-bookworm-slim AS builder
WORKDIR /app
RUN corepack enable
COPY package.json yarn.lock* .yarnrc.yml* ./
RUN yarn config set nodeLinker node-modules && yarn install
COPY . .
RUN yarn build

# Étape 2 : Runtime
FROM node:20-bookworm-slim
WORKDIR /app
RUN apt-get update && \
    apt-get install -y --no-install-recommends openjdk-17-jre-headless && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
# On s'assure que le contenu du dossier lavalink est bien copié
COPY src/lavalink ./lavalink

EXPOSE 8080

# CORRECTION : On définit le chemin de la config explicitement pour Java
CMD ["sh", "-c", "java -Xmx256M -Dlavalink.server.config.path=./lavalink/application.yml -jar ./lavalink/Lavalink.jar & sleep 90 && node dist/index.js"]
