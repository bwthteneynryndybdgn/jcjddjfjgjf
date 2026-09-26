// DR KAMRAN 

import { fileURLToPath } from 'url';
import axios from 'axios';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "moviebox",
    desc: "Search and download movies from MovieBox with interactive steps",
    category: "download",
    react: "📦",
    filename: __filename
},
async (conn, mek, m, { from, quoted, body, isCmd, command, args, q, reply }) => {
    try {
        if (!q) {
            return reply(
                `╔════════════════════════╗\n` +
                `║   📦 KAMRAN-MD MOVIEBOX 📦   \n` +
                `╚════════════════════════╝\n\n` +
                `❌ *Kripya movie ka naam dein!*\n\n` +
                `> 📌 *Example:* \`.moviebox Avatar\`\n` +
                `> ⚡ *Version:* \`12.00\``
            );
        }

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        const API_KEY = '2e0f218d3714d2e1';
        const BASE_URL = 'https://api-dark-shan-yt.koyeb.app/movie';

        const searchUrl = `${BASE_URL}/moviebox-search?q=${encodeURIComponent(q)}&apikey=${API_KEY}`;
        const searchRes = await axios.get(searchUrl, { timeout: 60000 });

        if (!searchRes.data?.status || !searchRes.data.data?.length) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ *Koi movie nahi mili!*");
        }

        const results = searchRes.data.data.slice(0, 5);
        const firstImage = results[0].image;
        
        const resultsList = results.map((movie, i) => { 
            const title = movie.title || 'Unknown Title'; 
            return `*${i + 1} ┃ ${title}*\n   📦 MovieBox • ${movie.year || 'N/A'}`; 
        }).join('\n\n');

        const searchCaption = `
╔════════════════════════╗
║   📦 MOVIEBOX SEARCH 📦   
╚════════════════════════╝

${resultsList}

🔢 *Reply with a number to select movie* 👇

> ⚡ *Version:* \`12.00\`
> 👑 *Powered by DOCTOR MD*`.trim();

        const searchMsg = await conn.sendMessage(from, { 
            image: { url: firstImage }, 
            caption: searchCaption 
        }, { quoted: mek });

        let step = 'movie', 
            lastMsgId = searchMsg.key.id, 
            selectedMovie = null, 
            downloads = null, 
            finalUrl = null, 
            selectedQuality = null, 
            movieTitle = '', 
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
                    movieTitle = selectedMovie.title || 'MovieBox Video';

                    const infoUrl = `${BASE_URL}/moviebox-info?url=${encodeURIComponent(selectedMovie.link)}&apikey=${API_KEY}`;
                    const infoRes = await axios.get(infoUrl, { timeout: 60000 });

                    if (!infoRes.data?.status || !infoRes.data.data?.downloads) { 
                        await conn.sendMessage(from, { text: '❎ No download links found for this movie.' }, { quoted: received }); 
                        cleanup(); 
                        return; 
                    }

                    downloads = infoRes.data.data.downloads;
                    const info = infoRes.data.data;

                    const qualityList = downloads.map((qItem, i) => { 
                        return `*${i + 1} ┃📥 ${qItem.quality || 'HD'} • ${qItem.size || 'N/A'}*`; 
                    }).join('\n\n');

                    const qualityCaption = `
╔════════════════════════╗
║   📦 MOVIEBOX INFO 📦   
╚════════════════════════╝

🎬 *Title:* ${movieTitle}
⭐ *Rating:* ${info.rating || 'N/A'}
📅 *Year:* ${info.year || 'N/A'}

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

                    selectedQuality = downloads[choice - 1];

                    const downloadUrl = `${BASE_URL}/moviebox-download?url=${encodeURIComponent(selectedQuality.link)}&apikey=${API_KEY}`;
                    const downloadRes = await axios.get(downloadUrl, { timeout: 60000 });

                    if (!downloadRes.data?.status || !downloadRes.data.data?.download) { 
                        await conn.sendMessage(from, { text: '❎ Failed to retrieve the download link.' }, { quoted: received }); 
                        cleanup(); 
                        return; 
                    }

                    const rawDownload = downloadRes.data.data.download;
                    // Fix: Ensure finalUrl is strictly a string (handles cases where API returns an array or object)
                    finalUrl = Array.isArray(rawDownload) ? rawDownload[0] : (typeof rawDownload === 'object' ? rawDownload.url : rawDownload);

                    if (!finalUrl || typeof finalUrl !== 'string') {
                        await conn.sendMessage(from, { text: '❎ Invalid download link received from API.' }, { quoted: received });
                        cleanup();
                        return;
                    }

                    const formatCaption = `
╔════════════════════════╗
║   📦 MOVIEBOX FORMAT 📦   
╚════════════════════════╝

🎬 *Title:* ${movieTitle}
💿 *Quality:* ${selectedQuality.quality || 'HD'}
📦 *Size:* ${selectedQuality.size || 'N/A'}

🔢 *Reply with format number* 👇

*1 ┃ 📽️ Video Format*
*2 ┃ 📁 Document Format*

> ⚡ *Version:* \`12.00\`
> 👑 *Powered by KAMRAN MD*`.trim();

                    const formatMsg = await conn.sendMessage(from, { 
                        image: { url: selectedMovie.image }, 
                        caption: formatCaption 
                    }, { quoted: received });

                    step = 'format'; 
                    lastMsgId = formatMsg.key.id;

                } else if (step === 'format') {
                    if (choice < 1 || choice > 2) { 
                        await conn.sendMessage(from, { text: '❎ Please select 1 (Video) or 2 (Document).' }, { quoted: received }); 
                        return; 
                    }

                    await conn.sendMessage(from, { react: { text: '📥', key: received.key } });

                    const fileName = `${movieTitle} [MovieBox].mp4`;

                    if (choice === 2) {
                        await conn.sendMessage(from, { 
                            document: { url: finalUrl }, 
                            mimetype: 'video/mp4', 
                            fileName: fileName, 
                            caption: `*${movieTitle}*\n\n> *👑 Powered by KAMRAN MD*` 
                        }, { quoted: received });
                    } else {
                        await conn.sendMessage(from, { 
                            video: { url: finalUrl }, 
                            caption: `*${movieTitle}*\n\n> *👑 Powered by KAMRAN MD*` 
                        }, { quoted: received });
                    }

                    await conn.sendMessage(from, { react: { text: '✅', key: received.key } });
                    cleanup();
                }

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
