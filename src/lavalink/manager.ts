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
        retryAmount: 50,
        retryDelay: 5000,
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
    console.log(`[Lavalink] Nœud ${node.options.host} connecté !`);
  });

  manager.nodeManager.on("error", (node, error) => {
    console.log(`[Lavalink] Erreur sur le nœud ${node.options.host}:`, error.message);
  });

  return manager;
}
