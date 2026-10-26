import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);

const API = 'https://api.omegatech.app/api/movie/MovieBox-pro';
const OFF = 'https://api.omegatech.app/api/movie/Moviebox_off';

cmd({
    pattern: "movie",
    alias: ["film", "moviebox", "mb"],
    use: '.movie Avatar',
    desc: "Search movies and get stream/download links from MovieBox with interactive steps",
    category: "downloader",
    react: "🎬",
    filename: __filename
},
async (conn, mek, m, { from, text, usedPrefix, command, reply }) => {
    try {
        const query = String(text || "").trim();
        if (!query) {
            return reply(
                `╔════════════════════════╗\n` +
                `║   🎬 KAMRAN-MD MOVIEBOX   \n` +
                `╚════════════════════════╝\n\n` +
                `❌ *Kripya movie ka naam dein!*\n\n` +
                `> 📌 *Example:* \`.movie Avatar\`\n` +
                `> ⚡ *Version:* \`12.00\``
            );
        }

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        const searchRes = await axios.get(API, {
            params: { action: 'search', keyword: query },
            timeout: 25000,
            headers: { 'User-Agent': 'KAMRAN-MD/1.0' }
        });

        const results = searchRes.data?.data?.results || searchRes.data?.results || [];
        if (!results.length) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ *Koi movie nahi mili!*");
        }

        const topResults = results.slice(0, 5);
        const firstCover = topResults[0].cover?.url || topResults[0].cover;

        const resultsList = topResults.map((v, i) => {
            const type = v.subjectType === 2 ? 'Series' : 'Movie';
            return `*${i + 1} ┃ ${v.title} (${type})*\n   ⭐ ${v.imdbRatingValue || 'N/A'} • ${v.releaseDate || ''}`;
        }).join('\n\n');

        const searchCaption = `
╔════════════════════════╗
║   🎬 MOVIEBOX SEARCH 🎬   
╚════════════════════════╝

${resultsList}

🔢 *Reply with a number to select movie* 👇

> ⚡ *Version:* \`12.00\`
> 👑 *Powered by KAMRAN MD*`.trim();

        const searchMsg = await conn.sendMessage(from, { 
            image: { url: firstCover || 'https://i.imgur.com/3Z7412f.jpg' }, 
            caption: searchCaption 
        }, { quoted: mek });

        let lastMsgId = searchMsg.key.id, 
            timeout = null;

        const handler = async (msgUpdate) => {
            try {
                const received = msgUpdate.messages[0];
                if (!received) return;
                
                const fromId = received.key.remoteJid || received.key.participant;
                if (fromId !== from) return;

                const quotedId = received.message?.extendedTextMessage?.contextInfo?.stanzaId;
                if (!quotedId || quotedId !== lastMsgId) return;

                const msgText = received.message?.conversation || received.message?.extendedTextMessage?.text;
                if (!msgText) return;

                const choice = parseInt(msgText.trim());
                if (isNaN(choice)) { 
                    await conn.sendMessage(from, { text: '❎ Please enter a valid number.' }, { quoted: received }); 
                    return; 
                }

                if (choice < 1 || choice > topResults.length) { 
                    await conn.sendMessage(from, { text: `❎ Select a valid number (1-${topResults.length})` }, { quoted: received }); 
                    return; 
                }

                await conn.sendMessage(from, { react: { text: '⏳', key: received.key } });

                const selectedItem = topResults[choice - 1];
                const sid = selectedItem.subjectId;
                let streams = [];

                if (selectedItem.proxyStream || selectedItem.proxyDownload) {
                    streams.push({ label: 'Stream (proxy)', url: selectedItem.proxyStream });
                    streams.push({ label: 'Download (proxy)', url: selectedItem.proxyDownload });
                }

                try {
                    const { data } = await axios.get(OFF, {
                        params: { action: 'play', subjectId: sid, season: selectedItem.season || 0, episode: 0 },
                        timeout: 25000,
                        headers: { 'User-Agent': 'KAMRAN-MD/1.0' }
                    });
                    const arr = data?.data?.streams || data?.streams || [];
                    arr.forEach((s, i) => {
                        const u = s.trapUrl || s.url || s.hls || s.dash;
                        if (u) streams.push({ label: s.resolutions || s.format || `Source ${i + 1}`, url: u });
                    });
                } catch {}

                let cap = `╔════════════════════════╗\n`;
                cap += `║   🎬 MOVIEBOX LINKS 🎬   \n`;
                cap += `╚════════════════════════╝\n\n`;
                cap += `🎬 *Title:* ${selectedItem.title}\n`;
                if (selectedItem.genre) cap += `🎭 *Genre:* ${selectedItem.genre}\n`;
                if (selectedItem.imdbRatingValue || selectedItem.imdb) cap += `⭐ *Rating:* ${selectedItem.imdbRatingValue || selectedItem.imdb}\n`;
                if (selectedItem.releaseDate) cap += `📅 *Date:* ${selectedItem.releaseDate}\n\n`;

                if (streams.length) {
                    streams.slice(0, 10).forEach((s, i) => {
                        if (s.url) cap += `🔗 *${s.label || i + 1}*:\n${s.url}\n\n`;
                    });
                } else {
                    cap += '_No direct streams found. Try another title._\n\n';
                }

                cap += `> ⚡ *Version:* \`12.00\`\n`;
                cap += `> 👑 *Powered by KAMRAN MD*`;

                const cover = selectedItem.cover?.url || selectedItem.cover;

                if (cover) {
                    await conn.sendMessage(from, { image: { url: cover }, caption: cap.trim() }, { quoted: received });
                } else {
                    await conn.sendMessage(from, { text: cap.trim() }, { quoted: received });
                }

                await conn.sendMessage(from, { react: { text: '✅', key: received.key } });
                cleanup();

            } catch (err) { 
                console.error('MovieBox handler error:', err); 
                cleanup(); 
            }
        };

        const cleanup = () => { 
            if (timeout) clearTimeout(timeout); 
            conn.ev.off('messages.upsert', handler); 
        };

        conn.ev.on('messages.upsert', handler);
        timeout = setTimeout(() => cleanup(), 60 * 1000);

    } catch (e) {
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        return reply("❌ *Kuch galat ho gaya, kripya thodi der baad koshish karein!*");
    }
});
