import { Player } from 'lavalink-client';

export async function getLyrics(player: Player) {
    const node = player.node;
    if (!node || !node.sessionId) return null;

    const protocol = node.options.secure ? 'https' : 'http';
    const baseUrl = `${protocol}://${node.options.host}:${node.options.port}`;
    const auth = node.options.authorization || 'youshallnotpass';

    const currentTrack = player.queue.current;
    if (!currentTrack) return null;

    // On prépare plusieurs URLs de secours
    const query = encodeURIComponent(`${currentTrack.info.author} ${currentTrack.info.title}`);
    
    const endpoints = [
        `${baseUrl}/v4/sessions/${node.sessionId}/players/${player.guildId}/track/lyrics`,
        `${baseUrl}/v4/lyrics/search?query=${query}`,
        `${baseUrl}/v4/lyrics/${currentTrack.info.identifier}`
    ];

    for (const url of endpoints) {
        try {
            console.log(`[LavaLyrics] Test : ${url}`);
            const response = await fetch(url, { headers: { 'Authorization': auth } });

            if (response.ok) {
                const res: any = await response.json();
                console.log(`[LavaLyrics] ✅ Succès sur ${url}`);

                const data = Array.isArray(res) ? res[0] : res;
                if (data?.lines) return data.lines.map((l: any) => l.line || l.text).join('\n');
                if (data?.text) return data.text;
            } else {
                console.log(`[LavaLyrics] ❌ Échec (${response.status})`);
            }
        } catch (e) {
            console.error(`[LavaLyrics] Erreur réseau`);
        }
    }

    return null;
}
