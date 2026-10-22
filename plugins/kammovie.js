//---------------------------------------------------------------------------
//           KAMRAN-MD - PRIME VIDEO INTERACTIVE PLUGIN
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
    pattern: "prime",
    alias: ["primevideo", "primemv", "pv"],
    desc: "Search movies and series from Prime Video via API",
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
                "Please provide a title to search on Prime Video!\n" +
                "📌 *Example:* `.prime New hindi`"
            );
        }

        await react("🔍");
        await reply(`🔍 _Searching for *"${q}"* on Prime Video servers..._`);

        const searchApiUrl = `https://supunofc.site/api/movie/primemv/search`;
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
            return reply(`🛸 *No Results Found!*\nPrime Video par *"${q}"* se related kuch nahi mila.`);
        }

        let listText = `┏━━━━━━━━━━━━━━━━━━━━━━┓\n`;
        listText += `┃ 🎬  *PRIME VIDEO SEARCH* 🎬 ┃\n`;
        listText += `┗━━━━━━━━━━━━━━━━━━━━━━┛\n\n`;
        listText += `🔎 *Query:* \`${q.toUpperCase()}\`\n`;
        listText += `✨ *Results Found:* ${results.length}\n\n`;
        listText += `┌─────────────────────┐\n`;

        const limit = Math.min(results.length, 10);
        for (let i = 0; i < limit; i++) {
            const v = results[i];
            const title = v.title || 'Unknown Title';
            const displayTitle = title.length > 45 ? title.substring(0, 45) + '...' : title;
            listText += `┃ 🎥 *[${i + 1}]* _${displayTitle} [${v.releaseYear || ''}]_\n`;
            if (i !== limit - 1) listText += `┃─────────────────────┃\n`;
        }

        listText += `└─────────────────────┘\n\n`;
        listText += `⚡ *Reply with the item number* to view details[span_0](start_span)[span_0](end_span).\n\n`;
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
                await reply(`🚀 *Fetching Prime Video Details...* Please wait!`);

                const detailsApiUrl = `https://supunofc.site/api/movie/primemv/details`;
                const detailResponse = await axios.get(detailsApiUrl, {
                    params: { apikey: API_KEY, url: selected.url },
                    timeout: 30000
                });

                if (detailResponse.status !== 200 || !detailResponse.data || !detailResponse.data.success) {
                    await react("❌");
                    return reply("❌ *Error:* Failed to pull details for this item.");
                }

                const itemData = detailResponse.data.result || {};
                const downloader = itemData.downloaderInfo || {};

                let cap = `┏━━━━━━━━━━━━━━━━━━━━━━━━━━┓\n`;
                cap += `┃ 🎥 *${itemData.title || selected.title}*\n`;
                cap += `┗━━━━━━━━━━━━━━━━━━━━━━━━━━┛\n\n`;
                
                if (itemData.releaseYear) cap += `📅 *Year:* ${itemData.releaseYear}[span_1](start_span)[span_1](end_span)\n`;
                if (itemData.imdbRating) cap += `⭐ *IMDb:* ${itemData.imdbRating}[span_2](start_span)[span_2](end_span)\n`;
                if (itemData.ageRating) cap += `🔞 *Age Rating:* ${itemData.ageRating}[span_3](start_span)[span_3](end_span)\n`;
                if (itemData.runtime) cap += `⏱️ *Runtime:* ${itemData.runtime}[span_4](start_span)[span_4](end_span)\n\n`;
                
                if (itemData.synopsis) {
                    const syn = itemData.synopsis.length > 200 ? itemData.synopsis.substring(0, 200) + '...' : itemData.synopsis;
                    cap += `📝 *Synopsis:* _${syn}_\n\n`;
                }

                if (downloader.streamType) {
                    cap += `🔒 *Stream Type:* \`${downloader.streamType}\`\n`;
                }
                if (downloader.videoResolutions) {
                    cap += `📺 *Resolutions:* ${downloader.videoResolutions.join(', ')}\n`;
                }

                cap += `\n🔗 *Official Watch URL:*\n_${itemData.url || selected.url}_\n\n`;
                cap += `> *© ${AUTHOR} ッ*`;

                const posterUrl = itemData.poster || selected.poster || "https://i.imgur.com/Te4kE0x.jpeg";
                const thumbBuffer = await getThumbnailBuffer(posterUrl);

                let messagePayload = {
                    image: { url: posterUrl },
                    caption: cap
                };

                if (thumbBuffer && Buffer.isBuffer(thumbBuffer)) {
                    messagePayload.jpegThumbnail = thumbBuffer;
                }

                await client.sendMessage(from, messagePayload, { quoted: msg });
                await client.sendMessage(from, { react: { text: "✅", key: msg.key } });

            } catch (detErr) {
                console.error("Prime Video details failed:", detErr.message);
                reply(`❌ An error occurred: ${detErr.message}`);
            }
        };

        client.ev.on("messages.upsert", detailsHandler);
        
        detailsTimeout = setTimeout(() => {
            client.ev.off("messages.upsert", detailsHandler);
        }, 300000);

    } catch (e) {
        console.error("Prime Video error:", e.message);
        await react("❌");
        return reply(`❌ *Error Processing Request:* ${e.message}`);
    }
});
