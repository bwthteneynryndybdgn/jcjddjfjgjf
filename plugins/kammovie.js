//---------------------------------------------------------------------------
//           KAMRAN-MD - KMMOVIES INTERACTIVE DOWNLOADER PLUGIN
//---------------------------------------------------------------------------

import { fileURLToPath } from 'url';
import path from 'path';
import axios from 'axios';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const AUTHOR = "KAMRAN-MINI-BOT";
const API_KEY = "supun_054d97c6fa2ed96f4cec12dc1a53544a";

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
    pattern: "kmmovies",
    alias: ["km", "kmmovie", "kmsearch"],
    desc: "Search and download movies from KMMovies via API",
    category: "download",
    filename: __filename
},
async (conn, mek, m, { from, text, reply, react, socket, sock }) => {
    const client = socket || sock || conn;

    try {
        const q = text ? text.trim() : "";

        if (!q) {
            return reply(
                "❌ *Opps! Query Missing* ❌\n\n" +
                "Please provide a movie name to search!\n" +
                "📌 *Example:* `.kmmovies New hindi`"
            );
        }

        await react("🔍");
        await reply(`🔍 _Searching for *"${q}"* on KMMovies servers..._`);

        const searchApiUrl = `https://supunofc.site/api/movie/kmmovie/search`;
        const response = await axios.get(searchApiUrl, {
            params: { apikey: API_KEY, q: q },
            timeout: 30000
        });

        if (response.status !== 200 || !response.data || !response.data.success) {
            await react("❌");
            return reply("🛸 *API Error:* Server responded with an invalid status.");
        }

        const results = response.data.result || [];
        if (results.length === 0) {
            await react("❌");
            return reply(`🛸 *No Results Found!*\nKMMovies par *"${q}"* naam ki koi movie nahi mili.`);
        }

        let listText = `┏━━━━━━━━━━━━━━━━━━━━━━┓\n`;
        listText += `┃ 🎬  *KMMOVIES SEARCH*  🎬 ┃\n`;
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
        listText += `⚡ *Reply with the item number* to download as Document.\n\n`;
        listText += `> *© ${AUTHOR} ッ*`;

        const sentSearch = await client.sendMessage(from, {
            text: listText
        }, { quoted: mek });

        const searchMsgId = sentSearch.key.id;
        let detailsTimeout;

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
                await reply(`🚀 *Processing KMMovies File...* \nUploading document. Please wait!`);

                const targetUrl = selected.url;

                await client.sendMessage(from, { react: { text: "📥", key: msg.key } });

                const cleanFileName = `${(selected.title || "Movie").replace(/[^a-zA-Z0-9 ]/g, "_")}_${selected.quality || 'HD'}.mp4`;

                let finalCaption = `┏━━━━━━━━━━━━━━━━━━━━━━━━┓\n`;
                finalCaption += `┃ 🎬 *${selected.title}*\n`;
                finalCaption += `┗━━━━━━━━━━━━━━━━━━━━━━━━┛\n\n`;
                if (selected.year) finalCaption += `┃ 📅 *Year:* ${selected.year}\n`;
                if (selected.quality) finalCaption += `┃ 🌟 *Quality:* ${selected.quality}\n`;
                finalCaption += `┗━━━━━━━━━━━━━━━━━━━━━━━━┛\n\n`;
                finalCaption += `> *© ${AUTHOR} ッ*`;

                const thumbBuffer = await getThumbnailBuffer(selected.poster);
                
                // Sending as Document file for fast and reliable download
                let documentPayload = {
                    document: { url: targetUrl },
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
                console.error("KMMovies process failed:", detErr.message);
                reply(`❌ An error occurred: ${detErr.message}`);
            }
        };

        client.ev.on("messages.upsert", detailsHandler);
        
        detailsTimeout = setTimeout(() => {
            client.ev.off("messages.upsert", detailsHandler);
        }, 300000);

    } catch (e) {
        console.error("KMMovies Downloader error:", e.message);
        await react("❌");
        return reply(`❌ *Error Processing Request:* ${e.message}`);
    }
});
