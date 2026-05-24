FROM node:23-bookworm-slim

WORKDIR /app

# Installation des dépendances système nécessaires pour certains modules natifs
RUN apt-get update && apt-get upgrade -y && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

RUN corepack enable

ENV YARN_NODE_LINKER=node-modules

COPY package.json yarn.lock .yarnrc.yml* ./

RUN yarn install

COPY . .

RUN yarn build

CMD ["node", "dist/index.js"]
