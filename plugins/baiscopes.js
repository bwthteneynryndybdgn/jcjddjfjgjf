// DR KAMRAN - BAISCOPES FIXED QUALITY
import { fileURLToPath } from 'url';
import axios from 'axios';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "baiscopes",
    desc: "Search and download movies from Baiscopes.lk safely",
    category: "download",
    react: "🎬",
    filename: __filename
},
async (conn, mek, m, { from, quoted, body, isCmd, command, args, q, reply }) => {
    try {
        if (!q) {
            return reply(
                `╔════════════════════════╗\n` +
                `║   🎬 KAMRAN-MD BAISCOPES 🎬   \n` +
                `╚════════════════════════╝\n\n` +
                `❌ *Kripya movie ka naam dein!*\n\n` +
                `> 📌 *Example:* \`.baiscopes Drishyam\`\n` +
                `> ⚡ *Version:* \`12.00\``
            );
        }

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        const API_KEYS = [
            'VajiraOfc',
            '858cfb0e63fd13da',
            '12f85decd3d58102',
            '902cbc90b2291c53',
            '9fe12e22dd6795f4'
        ];
        
        const BASE_URL = 'https://vajiraofc-apis.vercel.app/api/baiscopes';

        const fetchWithApi = async (endpoint, params = {}) => {
            let lastError = null;
            for (const key of API_KEYS) {
                try {
                    const queryParams = new URLSearchParams({ ...params, apikey: key });
                    const url = `${BASE_URL}${endpoint}?${queryParams.toString()}`;
                    const response = await axios.get(url, { timeout: 60000 });
                    
                    if (response.data && response.data.success) {
                        return response;
                    }
                } catch (err) {
                    lastError = err;
                    continue;
                }
            }
            throw lastError || new Error("All API keys failed.");
        };

        const searchRes = await fetchWithApi('/search', { q });

        if (!searchRes.data?.success || !searchRes.data.results?.length) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ *Koi movie nahi mili!*");
        }

        const results = searchRes.data.results.slice(0, 5);
        const firstImage = results[0].image;
        
        const resultsList = results.map((movie, i) => { 
            const title = movie.title || 'N/A'; 
            return `*${i + 1} ┃ ${title}*\n   📅 Year • ${movie.year || 'N/A'} | ⭐ IMDb • ${movie.imdbRate || 'N/A'}`; 
        }).join('\n\n');

        const searchCaption = `
╔════════════════════════╗
║   🎬 BAISCOPES SEARCH 🎬   
╚════════════════════════╝

${resultsList}

🔢 *Reply with a number to select movie* 👇

> ⚡ *Version:* \`12.00\`
> 👑 *Powered by KAMRAN MD*`.trim();

        const searchMsg = await conn.sendMessage(from, { 
            image: { url: firstImage }, 
            caption: searchCaption 
        }, { quoted: mek });

        let step = 'movie', 
            lastMsgId = searchMsg.key.id, 
            selectedMovie = null, 
            downloads = null, 
            timeout = null;

        const handler = async (msgUpdate) => {
            try {
                const received = msgUpdate.messages[0];
                if (!received) return;
                
                const fromId = received.key.remoteJid || received.key.participant;
                if (fromId !== from) return;

                const quotedId = received.message?.extendedTextMessage?.contextInfo?.stanzaId;
                if (!quotedId || quotedId !== lastMsgId) return;

                const text = received.message?.conversation || received.message?.extendedTextMessage?.text;
                if (!text) return;

                const choice = parseInt(text.trim());
                if (isNaN(choice)) { 
                    await conn.sendMessage(from, { text: '❎ Please enter a valid number.' }, { quoted: received }); 
                    return; 
                }

                await conn.sendMessage(from, { react: { text: '⏳', key: received.key } });

                if (step === 'movie') {
                    if (choice < 1 || choice > results.length) { 
                        await conn.sendMessage(from, { text: `❎ Select a valid number (1-${results.length})` }, { quoted: received }); 
                        return; 
                    }

                    selectedMovie = results[choice - 1];
                    const movieTitle = selectedMovie.title || 'Movie';

                    const infoRes = await fetchWithApi('/details', { url: selectedMovie.url });

                    if (!infoRes.data?.success || !infoRes.data.data?.downloads) { 
                        await conn.sendMessage(from, { text: '❎ No download links found for this movie.' }, { quoted: received }); 
                        cleanup(); 
                        return; 
                    }

                    downloads = infoRes.data.data.downloads;
                    const info = infoRes.data.data;

                    const qualityList = downloads.map((qItem, i) => { 
                        const qName = qItem.quality || qItem.resolution || qItem.name || 'HD';
                        const qSize = qItem.size || 'N/A';
                        return `*${i + 1} ┃📥 ${qName} • ${qSize}*`; 
                    }).join('\n\n');

                    const qualityCaption = `
╔════════════════════════╗
║   🎬 BAISCOPES INFO 🎬   
╚════════════════════════╝

🎬 *Title:* ${movieTitle}
📅 *Date:* ${info.date || 'N/A'}
🌍 *Country:* ${info.country || 'N/A'}
⏱️ *Duration:* ${info.duration || 'N/A'}

🔢 *Reply with quality number* 👇

${qualityList}

> ⚡ *Version:* \`12.00\`
> 👑 *Powered by KAMRAN MD*`.trim();

                    const qualityMsg = await conn.sendMessage(from, { 
                        image: { url: selectedMovie.image }, 
                        caption: qualityCaption 
                    }, { quoted: received });

                    step = 'quality'; 
                    lastMsgId = qualityMsg.key.id;

                } else if (step === 'quality') {
                    if (!downloads || choice < 1 || choice > downloads.length) { 
                        await conn.sendMessage(from, { text: `❎ Select a valid number (1-${downloads.length})` }, { quoted: received }); 
                        return; 
                    }

                    const selectedQuality = downloads[choice - 1];
                    const finalUrl = selectedQuality.link || selectedQuality.url;
                    const movieTitle = selectedMovie.title || 'Movie';
                    const qName = selectedQuality.quality || selectedQuality.resolution || selectedQuality.name || 'HD';

                    if (!finalUrl) {
                        await conn.sendMessage(from, { text: '❎ Is quality ka download link available nahi hai!' }, { quoted: received });
                        cleanup();
                        return;
                    }

                    await conn.sendMessage(from, { react: { text: '📥', key: received.key } });

                    await conn.sendMessage(from, { 
                        text: `╔════════════════════════╗\n` +
                              `║   🎬 MOVIE READY 🎬   \n` +
                              `╚════════════════════════╝\n\n` +
                              `🎬 *Title:* ${movieTitle}\n` +
                              `💿 *Quality:* ${qName}\n` +
                              `📦 *Size:* ${selectedQuality.size || 'N/A'}\n\n` +
                              `📥 *Direct Download Link:*\n${finalUrl}\n\n` +
                              `> ⚡ *Server Safe & Fast*\n` +
                              `> 👑 *Powered by KAMRAN MD*` 
                    }, { quoted: received });

                    await conn.sendMessage(from, { react: { text: '✅', key: received.key } }),
                    cleanup();
                }

            } catch (err) { 
                console.error('Baiscopes handler error:', err); 
                await conn.sendMessage(from, { text: '❎ Download karne mein error aa gaya!' }, { quoted: mek });
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
