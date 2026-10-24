//---------------------------------------------------------------------------
//           KAMRAN-MD - YOUTUBE INTERACTIVE PLAYLIST & DOWNLOADER
//---------------------------------------------------------------------------

import axios from 'axios';
import { fileURLToPath } from 'url';
import path from 'path';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const AUTHOR = "KAMRAN-MD";

cmd({
    pattern: "playlist",
    alias: ["ytlist", "ytslist", "slist"],
    desc: "Search YouTube songs and download as Audio/Video Document",
    category: "downloader",
    filename: __filename
},
async (conn, mek, m, { from, text, reply, react, socket, sock, usedPrefix, command }) => {
    const client = socket || sock || conn;
    const chatId = from || m.chat;
    const sender = m.sender;

    try {
        const q = text ? text.trim() : "";

        if (!q) {
            return reply(
                "❌ *Opps! Query Missing* ❌\n\n" +
                "Kripya gaane ka naam likhein!\n" +
                `📌 *Example:* \`${usedPrefix + command} Song pal\``
            );
        }

        await react("🔍");
        await reply(`🔍 _Searching for *"${q}"* on YouTube..._`);

        const searchUrl = `https://api.azbry.com/api/search/yts?q=${encodeURIComponent(q)}`;
        let response;
        try {
            response = await axios.get(searchUrl, { timeout: 30000 });
        } catch (err) {
            await react("❌");
            return reply(`❌ *Search API Error:* ${err.message}`);
        }

        if (!response || !response.data || !response.data.success) {
            await react("❌");
            return reply("🛸 *API Error:* Server responded with an invalid status.");
        }

        const results = response.data.result || [];
        if (results.length === 0) {
            await react("❌");
            return reply(`🛸 *No Results Found!*\n*"${q}"* se related kuch nahi mila.`);
        }

        if (!global.db.data.ytSearchCache) global.db.data.ytSearchCache = {};
        global.db.data.ytSearchCache[sender] = results;

        let listText = `┏━━━━━━━━━━━━━━━━━━━━━━┓\n`;
        listText += `┃ 🎵 *YOUTUBE PLAYLIST* 🎵 ┃\n`;
        listText += `┗━━━━━━━━━━━━━━━━━━━━━━┛\n\n`;
        listText += `🔎 *Query:* \`${q.toUpperCase()}\`\n`;
        listText += `✨ *Results Found:* ${results.length}\n\n`;
        listText += `┌─────────────────────┐\n`;

        const limit = Math.min(results.length, 20);
        for (let i = 0; i < limit; i++) {
            const v = results[i];
            const title = v.title.length > 35 ? v.title.substring(0, 35) + '...' : v.title;
            listText += `┃ 🎶 *[${i + 1}]* _${title}_\n`;
            listText += `┃      ⏱️ ${v.duration || 'N/A'} | 👁️ ${v.views || 'N/A'}\n`;
            if (i !== limit - 1) listText += `┃─────────────────────┃\n`;
        }

        listText += `└─────────────────────┘\n\n`;
        listText += `⚡ *Reply with the song number* to choose download format.\n\n`;
        listText += `> *© ${AUTHOR} ッ*`;

        const sentSearch = await client.sendMessage(chatId, { text: listText }, { quoted: mek });
        const searchMsgId = sentSearch.key.id;
        let formatTimeout;

        const formatHandler = async (update) => {
            try {
                const msg = update.messages[0];
                if (!msg?.message || msg.key.remoteJid !== chatId) return;

                const ctx = msg.message.extendedTextMessage?.contextInfo || msg.message.conversation?.contextInfo;
                if (!ctx || ctx.stanzaId !== searchMsgId) return;

                const choice = (msg.message.conversation || msg.message.extendedTextMessage?.text || "").trim();
                const num = parseInt(choice);
                if (isNaN(num) || num < 1 || num > limit) return;
                
                const selectedSong = results[num - 1];
                if (!selectedSong) return;

                client.ev.off("messages.upsert", formatHandler);
                clearTimeout(formatTimeout);

                await client.sendMessage(chatId, { react: { text: "⏳", key: msg.key } });

                let formatText = `┏━━━━━━━━━━━━━━━━━━━━━━━━━━┓\n`;
                formatText += `┃ 🎬 *${selectedSong.title}*\n`;
                formatText += `┗━━━━━━━━━━━━━━━━━━━━━━━━━━┛\n\n`;
                formatText += `⏱️ *Duration:* ${selectedSong.duration || 'N/A'}\n`;
                formatText += `👁️ *Views:* ${selectedSong.views || 'N/A'}\n\n`;
                formatText += `┌───────── CHOOSE FORMAT ─────────┐\n`;
                formatText += `┃ 🔥 *[1]* 🎵 Download as MP3 (Audio Document)\n`;
                formatText += `┃─────────────────────────────┃\n`;
                formatText += `┃ 🔥 *[2]* 🎬 Download as MP4 (Video Document)\n`;
                formatText += `└───────────────────────────────┘\n\n`;
                formatText += `⚡ *Reply '1' for MP3* or *'2' for MP4*.\n\n`;
                formatText += `> *© ${AUTHOR} ッ*`;

                const sentFormat = await client.sendMessage(chatId, { text: formatText }, { quoted: msg });
                const formatMsgId = sentFormat.key.id;
                let downloadTimeout;

                const downloadHandler = async (up) => {
                    try {
                        const dlMsg = up.messages[0];
                        if (!dlMsg?.message || dlMsg.key.remoteJid !== chatId) return;

                        const dlCtx = dlMsg.message.extendedTextMessage?.contextInfo || dlMsg.message.conversation?.contextInfo;
                        if (!dlCtx || dlCtx.stanzaId !== formatMsgId) return;

                        const opt = (dlMsg.message.conversation || dlMsg.message.extendedTextMessage?.text || "").trim();
                        if (opt !== '1' && opt !== '2') return;

                        client.ev.off("messages.upsert", downloadHandler);
                        clearTimeout(downloadTimeout);

                        const isVideo = opt === '2';
                        await client.sendMessage(chatId, { react: { text: "📥", key: dlMsg.key } });
                        await client.sendMessage(chatId, { text: `🚀 *Downloading ${isVideo ? 'MP4 Video' : 'MP3 Audio'} as Document...* Please wait!` }, { quoted: dlMsg });

                        const apiUrl = isVideo 
                            ? `https://api.azbry.com/api/download/ytmp4?url=${encodeURIComponent(selectedSong.url)}`
                            : `https://api.azbry.com/api/download/ytmp3?url=${encodeURIComponent(selectedSong.url)}`;

                        const apiRes = await axios.get(apiUrl, { timeout: 60000 });
                        if (!apiRes || !apiRes.data || !apiRes.data.success) {
                            await client.sendMessage(chatId, { react: { text: "❌", key: dlMsg.key } });
                            return client.sendMessage(chatId, { text: "❌ *Error:* Failed to fetch download URL from API." }, { quoted: dlMsg });
                        }

                        const downloadUrl = apiRes.data.result?.download;
                        const fileTitle = apiRes.data.result?.title || selectedSong.title;
                        const cleanFileName = `${fileTitle.replace(/[^a-zA-Z0-9 ]/g, "_")}.${isVideo ? 'mp4' : 'mp3'}`;

                        let documentPayload = {
                            document: { url: downloadUrl },
                            mimetype: isVideo ? "video/mp4" : "audio/mpeg",
                            fileName: cleanFileName,
                            caption: `🎵 *${fileTitle}*\n\n> *© ${AUTHOR} ッ*`
                        };

                        if (selectedSong.thumbnail) {
                            try {
                                const thumbRes = await axios.get(selectedSong.thumbnail, { responseType: 'arraybuffer', timeout: 10000 });
                                documentPayload.jpegThumbnail = Buffer.from(thumbRes.data);
                            } catch (e) {}
                        }

                        await client.sendMessage(chatId, documentPayload, { quoted: dlMsg });
                        await client.sendMessage(chatId, { react: { text: "✅", key: dlMsg.key } });

                    } catch (dlErr) {
                        console.error("Download failed:", dlErr.message);
                        await client.sendMessage(chatId, { react: { text: "❌", key: up.messages[0].key } });
                        client.sendMessage(chatId, { text: `❌ *Error during download:* ${dlErr.message}` }, { quoted: up.messages[0] });
                    }
                };

                client.ev.on("messages.upsert", downloadHandler);
                formatTimeout = setTimeout(() => {
                    client.ev.off("messages.upsert", downloadHandler);
                }, 300000);

            } catch (detErr) {
                console.error("Format selection failed:", detErr.message);
            }
        };

        client.ev.on("messages.upsert", formatHandler);
        formatTimeout = setTimeout(() => {
            client.ev.off("messages.upsert", formatHandler);
        }, 300000);

    } catch (e) {
        console.error("Play command error:", e.message);
        await react("❌");
        return reply(`❌ *Error Processing Request:* ${e.message}`);
    }
});
