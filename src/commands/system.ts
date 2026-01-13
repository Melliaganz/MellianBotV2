import { Message, EmbedBuilder } from 'discord.js';

export async function handleSystemCommands(message: Message, cmd: string) {
    if (cmd === 'ping') {
        await message.reply(`🏓 Pong ! \`${message.client.ws.ping}ms\``);
    }

    if (cmd === 'clean') {
        if (!message.member?.permissions.has('ManageMessages')) {
            return message.reply("❌ Tu n'as pas la permission de gérer les messages.");
        }

        const channel = message.channel;
        if (channel.isTextBased() && 'bulkDelete' in channel) {
            try {
                const messages = await channel.messages.fetch({ limit: 100 });
                const toDelete = messages.filter(m => 
                    m.author.id === message.client.user?.id || m.content.startsWith('!')
                );

                if (toDelete.size === 0) return message.reply("⚠️ Aucun message à nettoyer.");

                await channel.bulkDelete(toDelete, true);
                const confirm = await message.channel.send("✅ Nettoyage terminé !");
                setTimeout(() => confirm.delete().catch(() => null), 3000);
            } catch (error: any) {
                if (error.code === 50013) {
                    return message.reply("❌ Erreur : Je n'ai pas la permission 'Gérer les messages' dans ce salon.");
                }
                console.error("Erreur lors du clean:", error);
                message.reply("❌ Une erreur est survenue lors du nettoyage.");
            }
        }
    }

    if (cmd === 'help' || cmd === 'h') {
        const helpEmbed = new EmbedBuilder()
            .setTitle("📚 Aide - MellianBot")
            .setDescription("Voici la liste des commandes disponibles.")
            .setColor("#5865F2")
            .addFields(
                { name: "🎵 Musique", value: 
                    "`!play <recherche/url>` : Joue une musique.\n" +
                    "`!skip` : Passe à la suivante.\n" +
                    "`!stop` : Déconnecte le bot.\n" +
                    "`!queue` : Affiche la file d'attente.\n" +
                    "`!shuffle` : Mélange la file."
                },
                { name: "🛠️ Système", value: 
                    "`!ping` : Vérifie la latence.\n" +
                    "`!clean` : Nettoie les commandes (Admin).\n" +
                    "`!help` : Affiche ce menu."
                }
            )
            .setFooter({ text: "Tu peux aussi utiliser les boutons sous l'image !" });

        await message.reply({ embeds: [helpEmbed] });
    }
}
