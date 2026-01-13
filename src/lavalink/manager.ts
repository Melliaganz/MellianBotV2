import { LavalinkManager } from 'lavalink-client';
import { Client } from 'discord.js';

export function createLavalinkManager(client: Client) {
    const manager = new LavalinkManager({
        nodes: [{
            host: 'localhost',
            port: 2333,
            authorization: 'youshallnotpass',
            secure: false
        }],
        sendToShard: (guildId, payload) => {
            client.guilds.cache.get(guildId)?.shard.send(payload);
        },
        client: {
            id: process.env.CLIENT_ID || "000000000000000000",
            username: 'MellianBot'
        }
    });

    manager.nodeManager.on("connect", (node) => {
        console.log(`[Lavalink] Nœud ${node.id} connecté !`);
    });

    manager.nodeManager.on("error", (node, error) => {
        console.log(`[Lavalink] Erreur sur le nœud ${node.id}:`, error.message);
    });

    return manager;
}
