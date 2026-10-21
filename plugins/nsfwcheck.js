//---------------------------------------------------------------------------
//           KAMRAN-MD - THENKIRI INTERACTIVE EVENT PLUGIN
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
    pattern: "movie6",
    alias: ["nkiri", "film", "downloadmovie"],
    desc: "Search and download movies from dr via API",
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
                "📌 *Example:* `.movie 2026`"
            );
        }

        await react("🔍");
        await reply(`🔍 _Searching for *"${q}"* on TheNkiri servers..._`);

        const searchApiUrl = `https://vajiraofc-apis.vercel.app/api/thenkiri/search`;
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
            return reply(`🛸 *No Results Found!*\nTheNkiri par *"${q}"* naam ki koi movie nahi mili.`);
        }

        let listText = `┏━━━━━━━━━━━━━━━━━━━━━━┓\n`;
        listText += `┃ 🎬  *THENKIRI SEARCH*  🎬 ┃\n`;
        listText += `┗━━━━━━━━━━━━━━━━━━━━━━┛\n\n`;
        listText += `🔎 *Query:* \`${q.toUpperCase()}\`\n`;
        listText += `✨ *Results Found:* ${results.length}\n\n`;
        listText += `┌─────────────────────┐\n`;

        results.forEach((v, i) => {
            const title = v.title || 'Unknown Title';
            const displayTitle = title.length > 50 ? title.substring(0, 50) + '...' : title;
            listText += `┃ 🎥 *[${i + 1}]* _${displayTitle}_\n`;
            if (i !== results.length - 1) listText += `┃─────────────────────┃\n`;
        });

        listText += `└─────────────────────┘\n\n`;
        listText += `⚡ *Reply with the item number* to view movie details.\n\n`;
        listText += `> *© ${AUTHOR} ッ*`;

        // Send text message directly without image dependency to avoid fetch errors
        const sentSearch = await client.sendMessage(from, {
            text: listText
        }, { quoted: mek });

        const searchMsgId = sentSearch.key.id;
        let detailsTimeout;

        // ================= INTERACTIVE STEP: MOVIE DETAILS HANDLER =================
        const detailsHandler = async (update) => {
            try {
                const msg = update.messages[0];
                if (!msg?.message || msg.key.remoteJid !== from) return;

                const ctx = msg.message.extendedTextMessage?.contextInfo || msg.message.conversation?.contextInfo;
                if (ctx?.stanzaId !== searchMsgId) return;

                const choice = (msg.message.conversation || msg.message.extendedTextMessage?.text || "").trim();
                const num = parseInt(choice);
                if (isNaN(num) || num < 1 || num > results.length) return;
                
                const selected = results[num - 1];
                if (!selected) return;

                client.ev.off("messages.upsert", detailsHandler);
                clearTimeout(detailsTimeout);

                await react("⏳");

                const detailsApiUrl = `https://vajiraofc-apis.vercel.app/api/thenkiri/details`;
                const detailResponse = await axios.get(detailsApiUrl, {
                    params: { apikey: API_KEY, url: selected.url },
                    timeout: 30000
                });

                if (detailResponse.status !== 200 || !detailResponse.data || !detailResponse.data.success) {
                    await react("❌");
                    return reply("❌ *Error:* Failed to pull details for this item.");
                }

                const movieDetails = detailResponse.data.data || {};
                const directUrl = movieDetails.directDownloadUrl;

                if (!directUrl) {
                    await react("❌");
                    return reply("❌ *Sorry:* No direct download link was located for this selection.");
                }

                await client.sendMessage(from, { react: { text: "📥", key: msg.key } });

                const cleanFileName = `${(movieDetails.title || selected.title || "Movie").replace(/[^a-zA-Z0-9 ]/g, "_")}.mp4`;

                await reply(`🚀 *Processing TheNkiri File...* \nUploading document. Please wait!`);

                let finalCaption = `┏━━━━━━━━━━━━━━━━━━━━━━━━┓\n`;
                finalCaption += `┃ 🎬 *${movieDetails.title || selected.title}*\n`;
                finalCaption += `┗━━━━━━━━━━━━━━━━━━━━━━━━┛\n\n`;
                finalCaption += `┃ 📦 *Size:* ${movieDetails.size || 'N/A'}\n`;
                finalCaption += `┃ 🎥 *Quality:* ${movieDetails.quality || 'HD'}\n`;
                finalCaption += `┗━━━━━━━━━━━━━━━━━━━━━━━━┛\n\n`;
                finalCaption += `> *© ${AUTHOR} ッ*`;

                const thumbBuffer = await getThumbnailBuffer(movieDetails.imageUrl);
                
                let documentPayload = {
                    document: { url: directUrl },
                    mimetype: "video/mp4",
                    fileName: cleanFileName,
                    caption: finalCaption
                };

                if (thumbBuffer && Buffer.isBuffer(thumbBuffer)) {
                    documentPayload.jpegThumbnail = thumbBuffer;
                }

                await client.sendMessage(from, documentPayload, { quoted: msg });
                await client.sendMessage(from, { react: { text: "✅", key: msg.key } });

            } catch (detErr) {
                console.error("TheNkiri details failed:", detErr.message);
                reply(`❌ An error occurred while loading details: ${detErr.message}`);
            }
        };

        client.ev.on("messages.upsert", detailsHandler);
        
        detailsTimeout = setTimeout(() => {
            client.ev.off("messages.upsert", detailsHandler);
        }, 300000);

    } catch (e) {
        console.error("TheNkiri Downloader error:", e.message);
        await react("❌");
        return reply(`❌ *Error Processing Request:* ${e.message}`);
    }
});
