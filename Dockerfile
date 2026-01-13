# Étape 1 : Build
FROM node:20-bookworm-slim AS builder
WORKDIR /app

RUN corepack enable

# On copie les fichiers de config Yarn
COPY package.json yarn.lock* .yarnrc.yml* ./

# IMPORTANT : On force Yarn à générer un dossier node_modules classique (node-modules)
RUN yarn config set nodeLinker node-modules && yarn install

COPY . .
RUN yarn build

# Étape 2 : Runtime
FROM node:20-bookworm-slim
WORKDIR /app

# Installation de Java 17
RUN apt-get update && \
    apt-get install -y --no-install-recommends openjdk-17-jre-headless && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Copie des fichiers depuis le builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY src/lavalink ./lavalink

EXPOSE 8080

# Démarrage
CMD ["sh", "-c", "java -Xmx256M -jar ./lavalink/Lavalink.jar & node dist/index.js"]
