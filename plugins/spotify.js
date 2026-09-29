import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "spotify",
    alias: [],
    desc: "Download or search music from Spotify",
    category: "downloader",
    react: "🕒",
    filename: __filename,
    limit: true
},
async (conn, mek, m, { from, reply, text, usedPrefix, command }) => {
    try {
        if (!text) {
            return reply(
                `Contoh:\n` +
                `${usedPrefix + command} swim chase atlantic\n` +
                `${usedPrefix + command} https://open.spotify.com/track/xxxx`
            );
        }

        // ⏳ React - processing
        await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });
        
        // 1000ms delay to ensure react is visible
        await new Promise(resolve => setTimeout(resolve, 1000));

        let link = text;

        if (!text.includes('spotify.com')) {
            const searchRes = await fetch(`https://api.zenzxz.my.id/search/spotify?q=${encodeURIComponent(text)}`);
            const search = await searchRes.json();

            if (!search.status || !search.result?.results?.length) {
                throw new Error('No result');
            }

            const first = search.result.results[0];
            link = `https://open.spotify.com/track/${first.id}`;
        }

        const dlRes = await fetch(`https://api.zenzxz.my.id/download/spotify?url=${encodeURIComponent(link)}`);
        const dl = await dlRes.json();

        if (!dl.status || !dl.result?.download_url) {
            throw new Error('Download error');
        }

        await conn.sendMessage(from, {
            audio: { url: dl.result.download_url },
            mimetype: 'audio/mpeg',
            contextInfo: {
                externalAdReply: {
                    title: dl.result.title,
                    body: dl.result.artist,
                    thumbnailUrl: dl.result.thumbnail,
                    sourceUrl: link,
                    mediaType: 1,
                    renderLargerThumbnail: true
                }
            }
        }, { quoted: mek });

        // 800ms delay before success react
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // ✅ React - success
        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });

    } catch (e) {
        console.error("Error in spotify command:", e);
        // ❌ React - error
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
        await reply('Gagal mengambil atau mendownload lagu.');
    }
});
