import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { Player, Track } from 'lavalink-client';

export function formatTime(ms: number) {
    const minute = Math.floor(ms / 60000);
    const second = Math.floor((ms % 60000) / 1000);
    return `${minute}:${second < 10 ? '0' : ''}${second}`;
}

export function createProgressBar(current: number, total: number, isPaused: boolean, size = 15) {
    const progress = Math.round((size * current) / total);
    const emptyProgress = size - progress;
    return `\`${formatTime(current)}\` ${isPaused ? '⏸️' : '🎵'}${ '▬'.repeat(Math.max(0, progress))}🔘${'▬'.repeat(Math.max(0, emptyProgress))} \`${formatTime(total)}\``;
}

export const getControlRow = (paused: boolean, hasQueue: boolean) => {
    return new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId('pause').setEmoji(paused ? '▶️' : '⏸️').setStyle(paused ? ButtonStyle.Success : ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('skip').setEmoji('⏭️').setStyle(ButtonStyle.Secondary).setDisabled(!hasQueue),
        new ButtonBuilder().setCustomId('shuffle').setEmoji('🔀').setStyle(ButtonStyle.Secondary).setDisabled(!hasQueue),
        new ButtonBuilder().setCustomId('queue').setEmoji('📜').setLabel("File d'attente").setStyle(ButtonStyle.Primary),
    );
};

export const getSecondRow = () => {
    return new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId('stop').setEmoji('⏹️').setLabel('Arrêter').setStyle(ButtonStyle.Danger)
    );
};

export const generateMainEmbed = (player: Player, track: Track) => {
    const thumbnailUrl = track.info.artworkUrl || `https://i.ytimg.com/vi/${track.info.identifier}/hqdefault.jpg`;
    
    // Correction ici : on force la durée à 0 si elle est undefined pour rassurer TypeScript
    const duration = track.info.duration || 0;

    return new EmbedBuilder()
        .setTitle(`🎶 ${track.info.title}`)
        .setURL(track.info.uri)
        .setImage(thumbnailUrl)
        .setColor(player.paused ? '#FFFF00' : '#5865F2')
        .addFields({ 
            name: player.paused ? '⏸️ En pause' : '🚀 Lecture en cours', 
            value: createProgressBar(player.position, duration, player.paused) 
        })
        .setFooter({ text: `Source: ${track.info.sourceName} • Titres restants: ${player.queue.tracks.length}` });
};

export const generateQueueEmbed = (player: Player, page?: number) => {
    const tracks = player.queue.tracks;
    const current = player.queue.current;
    
    const nextTracks = tracks.slice(0, 10);
    const description = nextTracks.length > 0 
        ? nextTracks.map((t, i) => `**${i + 1}.** [${t.info.title.substring(0, 45)}](${t.info.uri}) \`[${formatTime(t.info.duration || 0)}]\``).join('\n')
        : "Aucune musique à venir.";

    const embed = new EmbedBuilder()
        .setTitle("📜 File d'attente actuelle")
        .setColor('#2F3136')
        .addFields({ name: "🎵 En cours", value: current ? `[${current.info.title}](${current.info.uri})` : "Rien" })
        .setDescription(`**À suivre :**\n${description}`)
        .setFooter({ text: `${tracks.length} musiques restantes` });

    if (tracks.length > 10) {
        embed.setFooter({ text: `...et ${tracks.length - 10} autres musiques • ${tracks.length} au total` });
    }

    return embed;
};
