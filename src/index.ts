import { Client, GatewayIntentBits, ActivityType } from "discord.js";
import { createLavalinkManager } from "./lavalink/manager.js";
import { handleMusicCommands, setupPlayerCollector } from "./commands/music.js";
import { handleSystemCommands } from "./commands/system.js";
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

const setGlobalStatus = () => {
  const playingCount = lavalink.players.size;
  const statusText = playingCount > 0 
    ? `du son sur ${playingCount} serveurs | !play` 
    : "des sons de ouf avec !play";

  client.user?.setPresence({
    activities: [{
      name: "custom",
      type: ActivityType.Custom,
      state: `Ecoute : ${statusText}`
    }],
    status: "online"
  });
};

lavalink.on("trackStart", async (player, track) => {
  if (!track) return;
  setupPlayerCollector(player, client);
  
  setGlobalStatus();

  const guild = client.guilds.cache.get(player.guildId);
  if (guild && client.user) {
    try {
      const botMember = guild.members.me || await guild.members.fetch(client.user.id);
      const title = track.info.title;
      const shortTitle = title.length > 25 ? title.substring(0, 25) + "..." : title;
      await botMember.setNickname(`♪ ${shortTitle}`);
    } catch (e) {
      console.log(`Impossible de changer le pseudo sur ${guild.name} (Permissions ?)`);
    }
  }
});

lavalink.on("queueEnd", async (player) => {
  const guild = client.guilds.cache.get(player.guildId);
  if (guild && client.user) {
    try {
      const botMember = guild.members.me || await guild.members.fetch(client.user.id);
      await botMember.setNickname(null);
    } catch (e) {
      console.log("Erreur reset pseudo.");
    }
  }
  setGlobalStatus();
});

lavalink.on("playerDestroy", async (player) => {
  const guild = client.guilds.cache.get(player.guildId);
  if (guild && client.user) {
    try {
      const botMember = guild.members.me || await guild.members.fetch(client.user.id);
      await botMember.setNickname(null);
    } catch (e) {
      console.log("Erreur reset pseudo.");
    }
  }
  setGlobalStatus();
});

client.once("ready", (c) => {
  lavalink.init({ id: c.user.id, username: c.user.username });
  setGlobalStatus();
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
  if (client.user) {
    client.user.setPresence({ status: "invisible" });
  }

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
