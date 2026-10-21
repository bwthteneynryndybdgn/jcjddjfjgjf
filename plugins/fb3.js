//---------------------------------------------------------------------------
//           KAMRAN-MD - FACEBOOK INTERACTIVE DOWNLOADER PLUGIN
//---------------------------------------------------------------------------

import { fileURLToPath } from 'url';
import path from 'path';
import axios from 'axios';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const AUTHOR = "KAMRAN-MINI-BOT";

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
    pattern: "fbsearch",
    alias: ["facebook2", "fbdlch"],
    desc: "Search and download Facebook videos via Omegatech API",
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
                "Please provide a search query for Facebook videos!\n" +
                "📌 *Example:* `.fb Sad song`"
            );
        }

        await react("🔍");
        await reply(`🔍 _Searching for *"${q}"* on Facebook via Omegatech..._`);

        const searchApiUrl = `https://api.omegatech.app/api/download/Facebook`;
        const response = await axios.get(searchApiUrl, {
            params: { action: "search", query: q, quality: "hdCopy" },
            timeout: 30000
        });

        if (response.status !== 200 || !response.data || !response.data.success) {
            await react("❌");
            return reply("🛸 *API Error:* Server responded with an invalid status.");
        }

        const videos = response.data.data?.videos || [];
        if (videos.length === 0) {
            await react("❌");
            return reply(`🛸 *No Results Found!*\nFacebook par *"${q}"* se related koi video nahi mili.`);
        }

        let listText = `┏━━━━━━━━━━━━━━━━━━━━━━┓\n`;
        listText += `┃ 🎬  *FACEBOOK SEARCH*  🎬 ┃\n`;
        listText += `┗━━━━━━━━━━━━━━━━━━━━━━┛\n\n`;
        listText += `🔎 *Query:* \`${q.toUpperCase()}\`\n`;
        listText += `✨ *Results Found:* ${videos.length}\n\n`;
        listText += `┌─────────────────────┐\n`;

        const limit = Math.min(videos.length, 10);
        for (let i = 0; i < limit; i++) {
            const v = videos[i];
            const title = v.title || 'Facebook Video';
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
                
                const selected = videos[num - 1];
                if (!selected) return;

                client.ev.off("messages.upsert", detailsHandler);
                clearTimeout(detailsTimeout);

                await react("⏳");
                await reply(`🚀 *Processing Facebook Video...* \nResolving direct download link. Please wait!`);

                const resolveApiUrl = `https://api.omegatech.app/api/download/Facebook`;
                const resolveRes = await axios.get(resolveApiUrl, {
                    params: { action: "resolve", url: selected.url, quality: "hdCopy" },
                    timeout: 30000
                });

                if (resolveRes.status !== 200 || !resolveRes.data || !resolveRes.data.success) {
                    await react("❌");
                    return reply("❌ *Error:* Failed to resolve direct download link.");
                }

                const directUrl = resolveRes.data.data?.directUrl;
                if (!directUrl) {
                    await react("❌");
                    return reply("❌ *Sorry:* Direct download link could not be resolved.");
                }

                await client.sendMessage(from, { react: { text: "📥", key: msg.key } });

                const videoTitleClean = (selected.title || "Facebook_Video").replace(/[^a-zA-Z0-9 ]/g, "_");
                const cleanFileName = `${videoTitleClean}_${resolveRes.data.data?.quality || 'HD'}.mp4`;

                let finalCaption = `┏━━━━━━━━━━━━━━━━━━━━━━━━┓\n`;
                finalCaption += `┃ 🎬 *${selected.title || 'Facebook Video'}*\n`;
                finalCaption += `┗━━━━━━━━━━━━━━━━━━━━━━━━┛\n\n`;
                finalCaption += `┃ 🌟 *Quality:* ${resolveRes.data.data?.quality?.toUpperCase() || 'HD'}\n`;
                finalCaption += `┗━━━━━━━━━━━━━━━━━━━━━━━━┛\n\n`;
                finalCaption += `> *© ${AUTHOR} ッ*`;

                let documentPayload = {
                    document: { url: directUrl },
                    mimetype: "video/mp4",
                    fileName: cleanFileName,
                    caption: finalCaption
                };

                await client.sendMessage(from, documentPayload, { quoted: msg });
                await client.sendMessage(from, { react: { text: "✅", key: msg.key } });

            } catch (detErr) {
                console.error("Facebook resolve/download failed:", detErr.message);
                reply(`❌ An error occurred: ${detErr.message}`);
            }
        };

        client.ev.on("messages.upsert", detailsHandler);
        
        detailsTimeout = setTimeout(() => {
            client.ev.off("messages.upsert", detailsHandler);
        }, 300000);

    } catch (e) {
        console.error("Facebook Downloader error:", e.message);
        await react("❌");
        return reply(`❌ *Error Processing Request:* ${e.message}`);
    }
});
