# Étape 1 : Build de l'application
FROM node:20-slim AS builder
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install
COPY . .
RUN yarn build

# Étape 2 : Runtime avec Java et Node
FROM node:20-slim
WORKDIR /app

# Installation de Java 17 pour Lavalink
RUN apt-get update && apt-get install -y openjdk-17-jre-headless && apt-get clean

# Copie des fichiers nécessaires
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY src/lavalink ./lavalink

# Port pour le serveur web (pour Uptime Robot)
EXPOSE 8080

# Script de démarrage pour lancer Lavalink et le Bot
CMD java -jar ./lavalink/Lavalink.jar & node dist/index.js
