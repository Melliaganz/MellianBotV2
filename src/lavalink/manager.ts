import { LavalinkManager } from "lavalink-client";
import { Client } from "discord.js";

export function createLavalinkManager(client: Client) {
  const manager = new LavalinkManager({
    nodes: [
      {
        host: process.env.LAVALINK_HOST || "127.0.0.1",
        port: parseInt(process.env.LAVALINK_PORT || "8080"),
        authorization: process.env.LAVALINK_PASSWORD || "youshallnotpass",
        secure: false,
        retryAmount: 30, // 30 tentatives couvrent largement le démarrage lent de Java
        retryDelay: 5000, // Attendre 5 secondes entre chaque essai
      },
    ],
    sendToShard: (guildId, payload) => {
      client.guilds.cache.get(guildId)?.shard.send(payload);
    },
    client: {
      id: process.env.CLIENT_ID || "000000000000000000",
      username: "MellianBot",
    },
  });

  manager.nodeManager.on("connect", (node) => {
    console.log(`[Lavalink] Nœud ${node.id} connecté !`);
  });

  manager.nodeManager.on("error", (node, error) => {
    console.log(`[Lavalink] Erreur sur le nœud ${node.id}:`, error.message);
  });

  return manager;
}
