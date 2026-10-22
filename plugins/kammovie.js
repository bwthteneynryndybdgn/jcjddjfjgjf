//---------------------------------------------------------------------------
//           KAMRAN-MD - BAISCOPES INTERACTIVE DOWNLOADER PLUGIN
//---------------------------------------------------------------------------

import { fileURLToPath } from 'url';
import path from 'path';
import axios from 'axios';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const AUTHOR = "KAMRAN-MINI-BOT";
const API_KEY = "supun_054d97c6fa2ed96f4cec12dc1a53544a";

function cleanTitle(title) {
  if (!title) return "Unknown Title";
  return title.replace(/සිංහල.*$/gi, "").replace(/උපසිරැසි.*$/gi, "").replace(/[^\x00-\x7F]/g, "").trim() || title;
}

async function getThumbnailBuffer(url) {
  if (!url) return null;
  try {
    const { data } = await axios.get(url, { responseType: "arraybuffer", timeout: 15000 });
    return Buffer.from(data);
  } catch (err) {
    return null;
  }
}

cmd({
    pattern: "baiscopes4",
    alias: ["bais4", "baiscope4"],
    desc: "Search and download movies from Baiscopes via API",
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
                "භාවිතා කරන ආකාරය: \`.baiscopes New\`\n" +
                "தயவுசெய்து தேட வேண்டிய திரைப்படத்தின் பெயரை வழங்கவும்!"
            );
        }

        await react("🔍");
        await reply(`🔍 _Searching for *"${q}"* on Baiscopes servers..._`);

        const searchApiUrl = `https://supunofc.site/api/movie/baiscopes/search`;
        let response;
        try {
            response = await axios.get(searchApiUrl, {
                params: { apikey: API_KEY, query: q },
                timeout: 30000
            });
        } catch (searchErr) {
            await react("❌");
            return reply(`❌ *Search API Error:* ${searchErr.message}`);
        }

        if (!response || response.status !== 200 || !response.data || !response.data.success) {
            await react("❌");
            return reply("🛸 *API Error:* Server responded with an invalid status.");
        }

        const results = response.data.result || [];
        if (results.length === 0) {
            await react("❌");
            return reply(`🛸 *No Results Found!*\nBaiscopes වෙතින් *"${q}"* සඳහා කිසිදු ප්‍රතිඵලයක් හමු නොවීය.`);
        }

        let listText = `┏━━━━━━━━━━━━━━━━━━━━━━┓\n`;
        listText += `┃ 🎬  *BAISCOPES SEARCH* 🎬 ┃\n`;
        listText += `┗━━━━━━━━━━━━━━━━━━━━━━┛\n\n`;
        listText += `🔎 *Query:* \`${q.toUpperCase()}\`\n`;
        listText += `✨ *Results Found:* ${results.length}\n\n`;
        listText += `┌─────────────────────┐\n`;

        const limit = Math.min(results.length, 10);
        for (let i = 0; i < limit; i++) {
            const v = results[i];
            const rawTitle = v.title || 'Unknown Title';
            const title = cleanTitle(rawTitle);
            const displayTitle = title.length > 40 ? title.substring(0, 40) + '...' : title;
            listText += `┃ 🎥 *[${i + 1}]* _${displayTitle} [${v.year || ''}]_\n`;
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

        const detailsHandler = async (update) => {
            try {
                const msg = update.messages[0];
                if (!msg?.message || msg.key.remoteJid !== from) return;

                const ctx = msg.message.extendedTextMessage?.contextInfo || msg.message.conversation?.contextInfo;
                if (!ctx || ctx.stanzaId !== searchMsgId) return;

                const choice = (msg.message.conversation || msg.message.extendedTextMessage?.text || "").trim();
                const num = parseInt(choice);
                if (isNaN(num) || num < 1 || num > limit) return;
                
                const selected = results[num - 1];
                if (!selected) return;

                client.ev.off("messages.upsert", detailsHandler);
                clearTimeout(detailsTimeout);

                await client.sendMessage(from, { react: { text: "⏳", key: msg.key } });
                await client.sendMessage(from, { text: `🚀 *Fetching Baiscopes Details...* Please wait!` }, { quoted: msg });

                const detailApiUrl = `https://supunofc.site/api/movie/baiscopes/details`;
                let detailResponse;
                try {
                    detailResponse = await axios.get(detailApiUrl, {
                        params: { apikey: API_KEY, url: selected.url },
                        timeout: 30000
                    });
                } catch (detErr) {
                    await client.sendMessage(from, { react: { text: "❌", key: msg.key } });
                    return client.sendMessage(from, { text: `❌ *Details API Error:* ${detErr.message}` }, { quoted: msg });
                }

                if (!detailResponse || detailResponse.status !== 200 || !detailResponse.data || !detailResponse.data.success) {
                    await client.sendMessage(from, { react: { text: "❌", key: msg.key } });
                    return client.sendMessage(from, { text: "❌ *Error:* Failed to pull details for this item." }, { quoted: msg });
                }

                const movieData = detailResponse.data.result || {};
                const links = movieData.links || [];

                if (links.length === 0) {
                    await client.sendMessage(from, { react: { text: "❌", key: msg.key } });
                    return client.sendMessage(from, { text: "❌ *Sorry:* No download links were located for this selection." }, { quoted: msg });
                }

                const movieTitleClean = cleanTitle(movieData.title || selected.title);

                let cap = `┏━━━━━━━━━━━━━━━━━━━━━━━━━━┓\n`;
                cap += `┃ 🎥 *${movieTitleClean}*\n`;
                cap += `┗━━━━━━━━━━━━━━━━━━━━━━━━━━┛\n\n`;
                
                if (movieData.releaseDate) cap += `📅 *Release:* ${movieData.releaseDate}\n`;
                if (movieData.ratings?.imdb?.rating) cap += `⭐ *IMDb:* ${movieData.ratings.imdb.rating}/10\n`;
                if (movieData.runtimeMin) cap += `⏱️ *Runtime:* ${movieData.runtimeMin} mins\n\n`;

                cap += `┌───────── DOWNLOAD LINKS ─────────┐\n`;
                
                links.forEach((lnk, i) => {
                    cap += `┃ 🔥 *[${i + 1}]* Size: \`${lnk.size || 'N/A'}\` | Type: \`${lnk.kind || 'Download'}\`\n`;
                    if (i !== links.length - 1) cap += `┃─────────────────────────────┃\n`;
                });

                cap += `└──────────────────────────────────┘\n\n`;
                cap += `⚡ *Reply with a link number* to download as Document.\n\n`;
                cap += `> *© ${AUTHOR} ッ*`;

                const detailImg = movieData.poster || selected.image || "https://i.imgur.com/Te4kE0x.jpeg";
                const thumbBuffer = await getThumbnailBuffer(detailImg);

                let messagePayload = {
                    image: { url: detailImg },
                    caption: cap
                };

                if (thumbBuffer && Buffer.isBuffer(thumbBuffer)) {
                    messagePayload.jpegThumbnail = thumbBuffer;
                }

                const sentDetail = await client.sendMessage(from, messagePayload, { quoted: msg });
                const detailMsgId = sentDetail.key.id;
                let downloadTimeout;

                const downloadHandler = async (up) => {
                    try {
                        const dlMsg = up.messages[0];
                        if (!dlMsg?.message || dlMsg.key.remoteJid !== from) return;

                        const dlCtx = dlMsg.message.extendedTextMessage?.contextInfo || dlMsg.message.conversation?.contextInfo;
                        if (!dlCtx || dlCtx.stanzaId !== detailMsgId) return;

                        const pick = (dlMsg.message.conversation || dlMsg.message.extendedTextMessage?.text || "").trim();
                        const dlNum = parseInt(pick);
                        if (isNaN(dlNum) || dlNum < 1 || dlNum > links.length) return;

                        const selectedLink = links[dlNum - 1];
                        if (!selectedLink || !selectedLink.url) return;

                        client.ev.off("messages.upsert", downloadHandler);
                        clearTimeout(downloadTimeout);

                        await client.sendMessage(from, { react: { text: "📥", key: dlMsg.key } });
                        await client.sendMessage(from, { text: `🚀 *Resolving Direct File Link...* Please wait!` }, { quoted: dlMsg });

                        const dlApiUrl = `https://supunofc.site/api/movie/baiscopes/dl`;
                        let dlRes;
                        try {
                            dlRes = await axios.get(dlApiUrl, {
                                params: { apikey: API_KEY, url: selectedLink.url },
                                timeout: 30000
                            });
                        } catch (apiErr) {
                            await client.sendMessage(from, { react: { text: "❌", key: dlMsg.key } });
                            return client.sendMessage(from, { text: `❌ *DL API Error:* ${apiErr.message}` }, { quoted: dlMsg });
                        }

                        if (!dlRes || dlRes.status !== 200 || !dlRes.data || !dlRes.data.success) {
                            await client.sendMessage(from, { react: { text: "❌", key: dlMsg.key } });
                            return client.sendMessage(from, { text: "❌ *Error:* Failed to resolve direct file download link." }, { quoted: dlMsg });
                        }

                        const downloadUrl = dlRes.data.result?.downloadUrl;
                        if (!downloadUrl) {
                            await client.sendMessage(from, { react: { text: "❌", key: dlMsg.key } });
                            return client.sendMessage(from, { text: "❌ *Sorry:* Direct download URL not found." }, { quoted: dlMsg });
                        }

                        const cleanFileName = `${movieTitleClean.replace(/[^a-zA-Z0-9 ]/g, "_")}_${selectedLink.size || 'HD'}.mp4`;

                        let finalCaption = `┏━━━━━━━━━━━━━━━━━━━━━━━━┓\n`;
                        finalCaption += `┃ 🎬 *${movieTitleClean}*\n`;
                        finalCaption += `┗━━━━━━━━━━━━━━━━━━━━━━━━┛\n\n`;
                        finalCaption += `┃ 📦 *Size:* ${selectedLink.size || 'N/A'}\n`;
                        finalCaption += `┗━━━━━━━━━━━━━━━━━━━━━━━━┛\n\n`;
                        finalCaption += `> *© ${AUTHOR} ッ*`;

                        let documentPayload = {
                            document: { url: downloadUrl },
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
                        console.error("Baiscopes download failed:", dlErr.message);
                        await client.sendMessage(from, { react: { text: "❌", key: up.messages[0].key } });
                        client.sendMessage(from, { text: `❌ *An error occurred during download:* ${dlErr.message}` }, { quoted: up.messages[0] });
                    }
                };

                client.ev.on("messages.upsert", downloadHandler);
                
                downloadTimeout = setTimeout(() => {
                    client.ev.off("messages.upsert", downloadHandler);
                }, 300000);

            } catch (detErr) {
                console.error("Baiscopes details failed:", detErr.message);
                client.sendMessage(from, { text: `❌ An error occurred while loading details: ${detErr.message}` }, { quoted: msg });
            }
        };

        client.ev.on("messages.upsert", detailsHandler);
        
        detailsTimeout = setTimeout(() => {
            client.ev.off("messages.upsert", detailsHandler);
        }, 300000);

    } catch (e) {
        console.error("Baiscopes Downloader error:", e.message);
        await react("❌");
        return reply(`❌ *Error Processing Request:* ${e.message}`);
    }
});
