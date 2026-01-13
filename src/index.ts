import { Client, GatewayIntentBits } from "discord.js";
import { createLavalinkManager } from "./lavalink/manager";
import { handleMusicCommands, setupPlayerCollector } from "./commands/music";
import { handleSystemCommands } from "./commands/system";
import "dotenv/config";
import express from 'express';
const app = express();
const PORT = process.env.PORT || 8080;

app.get('/', (req, res) => res.send('MellianBot est en vie !'));
app.listen(PORT, () => console.log(`Serveur de monitoring sur le port ${PORT}`));

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const lavalink = createLavalinkManager(client);

lavalink.on("trackStart", (player) => {
  setupPlayerCollector(player, client);
});

client.once("clientReady", (c) => {
  lavalink.init({ id: c.user.id, username: c.user.username });
  console.log(`${c.user.tag} prêt !`);
});

client.on("raw", (d) => lavalink.sendRawData(d));

client.on("messageCreate", async (m) => {
  if (m.author.bot || !m.guild || !m.content.startsWith("!")) return;

  const args = m.content.slice(1).trim().split(/ +/g);
  const cmd = args.shift()?.toLowerCase() || "";

  await handleMusicCommands(m, cmd, args, lavalink);
  await handleSystemCommands(m, cmd);
});

const shutdown = async () => {
  client.user?.setPresence({ status: "invisible" });

  const players = Array.from(lavalink.players.values());
  for (const player of players) {
    await player.destroy();
  }

  setTimeout(() => {
    client.destroy();
    process.exit(0);
  }, 500);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

client.login(process.env.DISCORD_TOKEN);
