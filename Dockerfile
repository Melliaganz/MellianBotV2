FROM node:20-slim

WORKDIR /app

# Activation de Corepack pour supporter Yarn 4
RUN corepack enable

# Installation des dépendances
COPY package.json yarn.lock ./
# Note : Pour Yarn 4+, on utilise souvent simplement 'yarn install'
RUN yarn install

# Copie du reste du code
COPY . .

# Build du projet TypeScript
RUN yarn build

# Commande de lancement
CMD ["node", "dist/index.js"]
