import { LavalinkManager } from "lavalink-client";
import { Client } from "discord.js";

export function createLavalinkManager(client: Client) {
  const manager = new LavalinkManager({
    nodes: [
      {
        host: process.env.LAVALINK_HOST || "127.0.0.1",
        port: parseInt(process.env.LAVALINK_PORT || "8080"),
        authorization: "youshallnotpass",
        secure: false,
        // On augmente l'agressivité des tentatives de reconnexion
        retryAmount: 100, 
        retryDelay: 10000, // 10 secondes entre chaque test
      },
    ],
    sendToShard: (guildId, payload) => {
      client.guilds.cache.get(guildId)?.shard.send(payload);
    },
    client: {
      id: process.env.CLIENT_ID || "1264609819533250600",
      username: "MellianBot",
    },
  });

  manager.nodeManager.on("connect", (node) => {
    console.log(`[Lavalink] Nœud ${node.options.host} connecté avec succès !`);
  });

  manager.nodeManager.on("error", (node, error) => {
    // On log l'erreur sans crasher
    console.log(`[Lavalink] Attente du nœud ${node.options.host}... (${error.message})`);
  });

  return manager;
}
