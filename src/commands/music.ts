import { Client, Message, TextChannel, ComponentType, MessageFlags } from "discord.js";
import { LavalinkManager, Player } from "lavalink-client";
import {
  generateMainEmbed,
  getControlRow,
  getSecondRow,
  generateQueueEmbed,
} from "../utils/embeds.js";

const activeMessages = new Map<string, Message>();
const activeCollectors = new Map<string, { stop: () => void }>();

export async function handleMusicCommands(
  message: Message,
  cmd: string,
  args: string[],
  lavalink: LavalinkManager
) {
  if (cmd === "play") {
    const query = args.join(" ");
    const vc = message.member?.voice.channel;

    if (!vc) return message.reply("❌ Rejoins un vocal !");
    if (!query) return message.reply("❌ Précise une recherche.");

    const node = lavalink.nodeManager.nodes.values().next().value;
    if (!node || !node.connected) return message.reply("❌ Nœud Lavalink non disponible, réessaie dans un instant.");

    const res = await node.search(
      { query: query.includes("http") ? query : `ytsearch:${query}` },
      message.author
    );
    if (!res.tracks.length) return message.reply("❌ Aucun résultat.");

    let player = lavalink.players.get(message.guildId!);

    if (!player) {
      player = lavalink.createPlayer({
        guildId: message.guildId!,
        voiceChannelId: vc.id,
        textChannelId: message.channelId,
        selfDeaf: true,
      });
    }

    if (!player.connected) await player.connect();

    if (res.loadType === "playlist") {
      await player.queue.add(res.tracks);
      message.reply(
        `✅ Playlist **${res.playlist?.name}** ajoutée (${res.tracks.length} titres).`
      );
    } else {
      await player.queue.add(res.tracks[0]);
      if (player.playing) {
        message.reply(`➕ Ajouté : **${res.tracks[0].info.title}**`);
      }
    }

    if (!player.playing) {
      await player.play();
    } else {
      await updatePlayerMessage(player);
    }
  }

  if (cmd === "queue" || cmd === "q") {
    const player = lavalink.players.get(message.guildId!);
    if (!player) return message.reply("❌ Aucune musique en cours.");
    await message.reply({ embeds: [generateQueueEmbed(player)] });
  }

  if (cmd === "skip" || cmd === "s") {
    const player = lavalink.players.get(message.guildId!);
    if (!player || !player.queue.current)
      return message.reply("❌ Rien ne joue.");

    if (player.queue.tracks.length === 0) {
      return message.reply(
        "❌ La file d'attente est vide, impossible de passer."
      );
    }

    await player.skip();
    message.reply("⏭️ Musique passée !");
  }

  if (cmd === "shuffle") {
    const player = lavalink.players.get(message.guildId!);
    if (!player || player.queue.tracks.length === 0) {
      return message.reply("❌ Pas assez de musiques pour mélanger.");
    }

    player.queue.shuffle();
    await updatePlayerMessage(player);
    message.reply("🔀 La file d'attente a été mélangée !");
  }

  if (cmd === "stop" || cmd === "leave" || cmd === "disconnect") {
    const player = lavalink.players.get(message.guildId!);
    if (!player)
      return message.reply("❌ Je ne suis pas connecté dans un salon.");

    activeCollectors.get(player.guildId)?.stop();
    activeCollectors.delete(player.guildId);
    activeMessages.delete(player.guildId);
    await player.destroy();
    message.reply("🛑 Musique arrêtée et déconnexion effectuée.");
  }
}

async function updatePlayerMessage(player: Player) {
  const msg = activeMessages.get(player.guildId);
  if (!msg) return;

  const current = player.queue.current;
  if (!current) return;

  try {
    await msg.edit({
      embeds: [generateMainEmbed(player, current)],
      components: [
        getControlRow(player.paused, player.queue.tracks.length > 0),
        getSecondRow(),
      ],
    });
  } catch (e) {
    activeMessages.delete(player.guildId);
  }
}

export async function setupPlayerCollector(player: Player, client: Client<true>) {
  const channel = client.channels.cache.get(
    player.textChannelId!
  ) as TextChannel;
  if (!channel) return;

  const track = player.queue.current;
  if (!track) return;

  const oldCollector = activeCollectors.get(player.guildId);
  if (oldCollector) oldCollector.stop();

  const oldMsg = activeMessages.get(player.guildId);
  if (oldMsg) oldMsg.delete().catch(() => null);

  const mainMessage = await channel.send({
    embeds: [generateMainEmbed(player, track)],
    components: [
      getControlRow(player.paused, player.queue.tracks.length > 0),
      getSecondRow(),
    ],
  });

  activeMessages.set(player.guildId, mainMessage);

  const collector = mainMessage.createMessageComponentCollector({
    componentType: ComponentType.Button,
    filter: (i) => {
      const guild = client.guilds.cache.get(i.guildId ?? "");
      return guild?.members.cache.get(i.user.id)?.voice.channelId === player.voiceChannelId;
    },
    idle: 10 * 60 * 1000,
  });

  activeCollectors.set(player.guildId, collector);

  collector.on("end", () => {
    activeCollectors.delete(player.guildId);
    activeMessages.delete(player.guildId);
  });

  collector.on("collect", async (i) => {
    const current = player.queue.current;
    if (!current) return;

    switch (i.customId) {
      case "pause":
        player.paused ? await player.resume() : await player.pause();
        await i.update({
          embeds: [generateMainEmbed(player, current)],
          components: [
            getControlRow(player.paused, player.queue.tracks.length > 0),
            getSecondRow(),
          ],
        });
        break;

      case "skip":
        if (player.queue.tracks.length === 0) {
          await i.reply({
            content: "❌ Rien à passer dans la file !",
            flags: [MessageFlags.Ephemeral],
          });
        } else {
          await player.skip();
          await i.deferUpdate();
        }
        break;

      case "shuffle":
        player.queue.shuffle();
        await updatePlayerMessage(player);
        await i.reply({
          content: "🔀 File mélangée !",
          flags: [MessageFlags.Ephemeral],
        });
        break;

      case "stop":
        collector.stop();
        await player.destroy();
        await i.deferUpdate();
        break;

      case "queue":
        await i.reply({
          embeds: [generateQueueEmbed(player)],
          flags: [MessageFlags.Ephemeral],
        });
        break;
    }
  });
}
