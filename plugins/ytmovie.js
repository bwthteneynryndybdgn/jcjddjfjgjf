//---------------------------------------------------------------------------
//           KAMRAN-MD - CINESUBZ INTERACTIVE DOWNLOADER PLUGIN
//---------------------------------------------------------------------------

import { fileURLToPath } from 'url';
import path from 'path';
import axios from 'axios';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const AUTHOR = "KAMRAN-MINI-BOT";
const API_KEY = "VajiraOfc";

async function getThumbnailBuffer(url) {
  if (!url) return null;
  try {
    const { data } = await axios.get(url, { responseType: "arraybuffer" });
    return Buffer.from(data);
  } catch (err) {
    return null;
  }
}

cmd({
    pattern: "cinesubz7",
    alias: ["cs", "cinesubzdl"],
    desc: "Search and download movies with Sinhala subtitles from CineSubz",
    category: "download",
    filename: __filename
},
async (conn, mek, m, { from, text, reply, react, socket, sock }) => {
    const client = socket || sock || conn;

    try {
        const q = text ? text.trim() : "";

        if (!q) {
            return reply(
                "❌ *Opps! Title Missing* ❌\n\n" +
                "Please provide a movie name to search!\n" +
                "📌 *Example:* `.cinesubz 2026`"
            );
        }

        await react("🔍");
        await reply(`🔍 _Searching for *"${q}"* on CineSubz servers..._`);

        const searchApiUrl = `https://vajiraofc-apis.vercel.app/api/cinesubz/search`;
        const response = await axios.get(searchApiUrl, {
            params: { apikey: API_KEY, q: q },
            timeout: 30000
        });

        if (response.status !== 200 || !response.data || !response.data.success) {
            await react("❌");
            return reply("🛸 *API Error:* Server responded with an invalid status.");
        }

        const results = response.data.results || [];
        if (results.length === 0) {
            await react("❌");
            return reply(`🛸 *No Results Found!*\nCinesubz par *"${q}"* naam ki koi movie nahi mili.`);
        }

        let listText = `┏━━━━━━━━━━━━━━━━━━━━━━┓\n`;
        listText += `┃ 🎬  *CINESUBZ SEARCH*  🎬 ┃\n`;
        listText += `┗━━━━━━━━━━━━━━━━━━━━━━┛\n\n`;
        listText += `🔎 *Query:* \`${q.toUpperCase()}\`\n`;
        listText += `✨ *Results Found:* ${results.length}\n\n`;
        listText += `┌─────────────────────┐\n`;

        const limit = Math.min(results.length, 10);
        for (let i = 0; i < limit; i++) {
            const v = results[i];
            const title = v.title || 'Unknown Title';
            const displayTitle = title.length > 45 ? title.substring(0, 45) + '...' : title;
            listText += `┃ 🎥 *[${i + 1}]* _${displayTitle}_\n`;
            if (i !== limit - 1) listText += `┃─────────────────────┃\n`;
        }

        listText += `└─────────────────────┘\n\n`;
        listText += `⚡ *Reply with the item number* to view movie details.\n\n`;
        listText += `> *© ${AUTHOR} ッ*`;

        const sentSearch = await client.sendMessage(from, {
            text: listText
        }, { quoted: mek });

        const searchMsgId = sentSearch.key.id;
        let detailsTimeout;

        // ================= INTERACTIVE STEP: DETAILS & QUALITY HANDLER =================
        const detailsHandler = async (update) => {
            try {
                const msg = update.messages[0];
                if (!msg?.message || msg.key.remoteJid !== from) return;

                const ctx = msg.message.extendedTextMessage?.contextInfo || msg.message.conversation?.contextInfo;
                if (ctx?.stanzaId !== searchMsgId) return;

                const choice = (msg.message.conversation || msg.message.extendedTextMessage?.text || "").trim();
                const num = parseInt(choice);
                if (isNaN(num) || num < 1 || num > limit) return;
                
                const selected = results[num - 1];
                if (!selected) return;

                client.ev.off("messages.upsert", detailsHandler);
                clearTimeout(detailsTimeout);

                await react("⏳");

                const detailsApiUrl = `https://vajiraofc-apis.vercel.app/api/cinesubz/details`;
                const detailResponse = await axios.get(detailsApiUrl, {
                    params: { apikey: API_KEY, url: selected.url },
                    timeout: 30000
                });

                if (detailResponse.status !== 200 || !detailResponse.data || !detailResponse.data.success) {
                    await react("❌");
                    return reply("❌ *Error:* Failed to pull details for this item.");
                }

                // Handling response structure (movie or episode data)
                const resData = detailResponse.data;
                const movieData = resData.movie || resData.details || {};
                const players = movieData.players || resData.downloads || [];

                if (players.length === 0) {
                    await react("❌");
                    return reply("❌ *Sorry:* No downloadable video links were located for this selection.");
                }

                let cap = `┏━━━━━━━━━━━━━━━━━━━━━━━━━━┓\n`;
                cap += `┃ 🎥 *${movieData.title || selected.title}*\n`;
                cap += `┗━━━━━━━━━━━━━━━━━━━━━━━━━━┛\n\n`;
                
                if (movieData.info?.year) cap += `📅 *Year:* ${movieData.info.year}\n`;
                if (movieData.meta?.language) cap += `🗣️ *Language:* ${movieData.meta.language}\n`;
                if (movieData.genres && movieData.genres.length > 0) cap += `🎭 *Genres:* ${movieData.genres.join(', ')}\n\n`;

                cap += `┌───────── QUALITIES ─────────┐\n`;
                
                players.forEach((pl, i) => {
                    const qlty = pl.quality || 'HD';
                    const sz = pl.size_mb ? `${(pl.size_mb / 1024).toFixed(2)} GB` : (pl.size || 'Unknown Size');
                    cap += `┃ 🔥 *[${i + 1}]* Quality: \`${qlty}\` | Size: \`${sz}\`\n`;
                    if (i !== players.length - 1) cap += `┃─────────────────────┃\n`;
                });

                cap += `└─────────────────────────────┘\n\n`;
                cap += `⚡ *Reply with a quality number* to download as Document.\n\n`;
                cap += `> *© ${AUTHOR} ッ*`;

                const detailImg = movieData.poster || selected.poster || "https://i.imgur.com/Te4kE0x.jpeg";

                const sentDetail = await client.sendMessage(from, {
                    image: { url: detailImg },
                    caption: cap
                }, { quoted: msg });

                const detailMsgId = sentDetail.key.id;
                let downloadTimeout;

                // ================= INTERACTIVE STEP: DOWNLOAD HANDLER =================
                const downloadHandler = async (up) => {
                    try {
                        const dlMsg = up.messages[0];
                        if (!dlMsg?.message || dlMsg.key.remoteJid !== from) return;

                        const dlCtx = dlMsg.message.extendedTextMessage?.contextInfo || dlMsg.message.conversation?.contextInfo;
                        if (dlCtx?.stanzaId !== detailMsgId) return;

                        const pick = (dlMsg.message.conversation || dlMsg.message.extendedTextMessage?.text || "").trim();
                        const dlNum = parseInt(pick);
                        if (isNaN(dlNum) || dlNum < 1 || dlNum > players.length) return;

                        const selectedPlayer = players[dlNum - 1];
                        if (!selectedPlayer || !selectedPlayer.url) return;

                        client.ev.off("messages.upsert", downloadHandler);
                        clearTimeout(downloadTimeout);

                        await client.sendMessage(from, { react: { text: "📥", key: dlMsg.key } });
                        
                        const targetFileUrl = selectedPlayer.url;
                        const cleanFileName = `${(movieData.title || selected.title || "Movie").replace(/[^a-zA-Z0-9 ]/g, "_")}_${selectedPlayer.quality || 'HD'}.mp4`;

                        await reply(`🚀 *Processing CineSubz File...* \nUploading document. Please wait!`);

                        let finalCaption = `┏━━━━━━━━━━━━━━━━━━━━━━━━┓\n`;
                        finalCaption += `┃ 🎬 *${movieData.title || selected.title}*\n`;
                        finalCaption += `┗━━━━━━━━━━━━━━━━━━━━━━━━┛\n\n`;
                        finalCaption += `┃ 🌟 *Quality:* ${selectedPlayer.quality || 'HD'}\n`;
                        finalCaption += `┃ 📦 *Size:* ${selectedPlayer.size_mb ? `${(selectedPlayer.size_mb / 1024).toFixed(2)} GB` : (selectedPlayer.size || 'N/A')}\n`;
                        finalCaption += `┗━━━━━━━━━━━━━━━━━━━━━━━━┛\n\n`;
                        finalCaption += `> *© ${AUTHOR} ッ*`;

                        const thumbBuffer = await getThumbnailBuffer(detailImg);
                        
                        let documentPayload = {
                            document: { url: targetFileUrl },
                            mimetype: "video/mp4",
                            fileName: cleanFileName,
                            caption: finalCaption
                        };

                        if (thumbBuffer && Buffer.isBuffer(thumbBuffer)) {
                            documentPayload.jpegThumbnail = thumbBuffer;
                        }

                        await client.sendMessage(from, documentPayload, { quoted: dlMsg });
                        await client.sendMessage(from, { react: { text: "✅", key: dlMsg.key } });

                    } catch (dlErr) {
                        console.error("CineSubz download failed:", dlErr.message);
                        reply(`❌ An error occurred during file delivery: ${dlErr.message}`);
                    }
                };

                client.ev.on("messages.upsert", downloadHandler);
                
                downloadTimeout = setTimeout(() => {
                    client.ev.off("messages.upsert", downloadHandler);
                }, 300000);

            } catch (detErr) {
                console.error("CineSubz details failed:", detErr.message);
                reply(`❌ An error occurred while loading details: ${detErr.message}`);
            }
        };

        client.ev.on("messages.upsert", detailsHandler);
        
        detailsTimeout = setTimeout(() => {
            client.ev.off("messages.upsert", detailsHandler);
        }, 300000);

    } catch (e) {
        console.error("CineSubz Downloader error:", e.message);
        await react("❌");
        return reply(`❌ *Error Processing Request:* ${e.message}`);
    }
});
