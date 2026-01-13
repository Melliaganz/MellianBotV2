import { LavalinkManager } from "lavalink-client";
import { Client } from "discord.js";
import fs from "fs";
import path from "path";
export function createLavalinkManager(client: Client) {
  // --- SECTION DEBUG ---
  const lavalinkDir = path.join(process.cwd(), "lavalink");
  console.log(`[Debug] Vérification du dossier : ${lavalinkDir}`);
  try {
    const files = fs.readdirSync(lavalinkDir);
    console.log(
      `[Debug] Fichiers trouvés dans /lavalink : ${files.join(", ")}`
    );
  } catch (err) {
    console.log(`[Debug] Erreur : Impossible de lire le dossier /lavalink`);
  }
  const manager = new LavalinkManager({
    nodes: [
      {
        host: process.env.LAVALINK_HOST || "127.0.0.1",
        port: parseInt(process.env.LAVALINK_PORT || "8080"),
        authorization: process.env.LAVALINK_PASSWORD || "youshallnotpass",
        secure: false,
        retryAmount: 50,
        retryDelay: 5000,
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
