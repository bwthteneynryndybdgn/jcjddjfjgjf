//---------------------------------------------------------------------------
//           KAMRAN-MD - CARTOONLK INTERACTIVE DOWNLOADER PLUGIN
//---------------------------------------------------------------------------

import { fileURLToPath } from 'url';
import path from 'path';
import axios from 'axios';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const AUTHOR = "KAMRAN-MINI-BOT";
const API_KEY = "VajiraOfc";

function cleanTitle(title) {
  if (!title) return "Unknown Title";
  return title.replace(/සිංහල.*$/gi, "").replace(/හඩකැවූ.*$/gi, "").replace(/[^\x00-\x7F]/g, "").trim() || title;
}

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
    pattern: "cartoon",
    alias: ["cartoonlk", "cartoons", "animated"],
    desc: "Search and download cartoons and animated movies from CartoonLK",
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
                "Please provide a cartoon name to search!\n" +
                "📌 *Example:* `.cartoon lord`"
            );
        }

        await react("🔍");
        await reply(`🔍 _Searching for *"${q}"* on CartoonLK servers..._`);

        const searchApiUrl = `https://vajiraofc-apis.vercel.app/api/cartoonlk/search`;
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
            return reply(`🛸 *No Results Found!*\nCartoonLK par *"${q}"* naam ka koi cartoon nahi mila.`);
        }

        let listText = `┏━━━━━━━━━━━━━━━━━━━━━━┓\n`;
        listText += `┃ 🎬  *CARTOONLK SEARCH*  🎬 ┃\n`;
        listText += `┗━━━━━━━━━━━━━━━━━━━━━━┛\n\n`;
        listText += `🔎 *Query:* \`${q.toUpperCase()}\`\n`;
        listText += `✨ *Results Found:* ${results.length}\n\n`;
        listText += `┌─────────────────────┐\n`;

        const limit = Math.min(results.length, 10);
        for (let i = 0; i < limit; i++) {
            const v = results[i];
            const rawTitle = v.title || 'Unknown Title';
            const title = cleanTitle(rawTitle);
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
                await reply(`🚀 *Processing CartoonLK File...* \nFetching download link. Please wait!`);

                // Step 1: Get Details / Download info
                const detailsApiUrl = `https://vajiraofc-apis.vercel.app/api/cartoonlk/details`;
                const detailResponse = await axios.get(detailsApiUrl, {
                    params: { apikey: API_KEY, url: selected.url },
                    timeout: 30000
                });

                if (detailResponse.status !== 200 || !detailResponse.data || !detailResponse.data.success) {
                    await react("❌");
                    return reply("❌ *Error:* Failed to pull details for this item.");
                }

                const movieData = detailResponse.data.data || {};
                const cartoonTitleClean = cleanTitle(movieData.title || selected.title);
                const posterImg = movieData.image || selected.poster || "https://i.imgur.com/Te4kE0x.jpeg";

                // Step 2: Get Direct Download URL using download endpoint
                const downloadApiUrl = `https://vajiraofc-apis.vercel.app/api/cartoonlk/download`;
                const dlResponse = await axios.get(downloadApiUrl, {
                    params: { apikey: API_KEY, url: selected.url },
                    timeout: 30000
                });

                if (dlResponse.status !== 200 || !dlResponse.data || !dlResponse.data.success) {
                    await react("❌");
                    return reply("❌ *Error:* Failed to generate direct download link.");
                }

                const directDownloadUrl = dlResponse.data.data?.download_url || dlResponse.data.download_url;

                if (!directDownloadUrl) {
                    await react("❌");
                    return reply("❌ *Sorry:* Direct download link could not be resolved.");
                }

                await client.sendMessage(from, { react: { text: "📥", key: msg.key } });

                const cleanFileName = `${cartoonTitleClean.replace(/[^a-zA-Z0-9 ]/g, "_")}.mp4`;

                let finalCaption = `┏━━━━━━━━━━━━━━━━━━━━━━━━┓\n`;
                finalCaption += `┃ 🎬 *${cartoonTitleClean}*\n`;
                finalCaption += `┗━━━━━━━━━━━━━━━━━━━━━━━━┛\n\n`;
                if (movieData.quality) finalCaption += `┃ 🌟 *Quality:* ${movieData.quality}\n`;
                if (movieData.size) finalCaption += `┃ 📦 *Size:* ${movieData.size}\n`;
                finalCaption += `┗━━━━━━━━━━━━━━━━━━━━━━━━┛\n\n`;
                finalCaption += `> *© ${AUTHOR} ッ*`;

                const thumbBuffer = await getThumbnailBuffer(posterImg);
                
                let documentPayload = {
                    document: { url: directDownloadUrl },
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
                console.error("CartoonLK process failed:", detErr.message);
                reply(`❌ An error occurred: ${detErr.message}`);
            }
        };

        client.ev.on("messages.upsert", detailsHandler);
        
        detailsTimeout = setTimeout(() => {
            client.ev.off("messages.upsert", detailsHandler);
        }, 300000);

    } catch (e) {
        console.error("CartoonLK Downloader error:", e.message);
        await react("❌");
        return reply(`❌ *Error Processing Request:* ${e.message}`);
    }
});
