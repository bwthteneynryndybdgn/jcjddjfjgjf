//---------------------------------------------------------------------------
//           KAMRAN-MD - ANIMOSTLK INTERACTIVE DOWNLOADER PLUGIN
//---------------------------------------------------------------------------

import { fileURLToPath } from 'url';
import path from 'path';
import axios from 'axios';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const AUTHOR = "KAMRAN-MD";
const API_KEY = "VajiraOfc";

// Helper function for Stylist Badi ABC Text
const toStylistUpper = (text) => {
    if (!text || typeof text !== 'string') return '';
    const uppercaseMap = {
        'a': 'ᴀ', 'b': 'ʙ', 'c': 'ᴄ', 'd': 'ᴅ', 'e': 'ᴇ', 'f': 'ғ', 'g': 'ɢ', 'h': 'ʜ', 'i': 'ɪ',
        'j': 'ᴊ', 'k': 'ᴋ', 'l': 'ʟ', 'm': 'ᴍ', 'n': 'ɴ', 'o': 'ᴏ', 'p': 'ᴘ', 'q': 'ǫ', 'r': 'ʀ',
        's': 's', 't': 'ᴛ', 'u': 'ᴜ', 'v': 'ᴠ', 'w': 'ᴡ', 'x': 'x', 'y': 'ʏ', 'z': 'ᴢ',
        'A': 'ᴀ', 'B': 'ʙ', 'C': 'ᴄ', 'D': 'ᴅ', 'E': 'ᴇ', 'F': 'ғ', 'G': 'ɢ', 'H': 'ʜ', 'I': 'ɪ',
        'J': 'ᴊ', 'K': 'ᴋ', 'L': 'ʟ', 'M': 'ᴍ', 'N': 'ɴ', 'O': 'ᴏ', 'P': 'ᴘ', 'Q': 'ǫ', 'R': 'ʀ',
        'S': 's', 'T': 'ᴛ', 'U': 'ᴜ', 'V': 'ᴠ', 'W': 'ᴡ', 'X': 'x', 'Y': 'ʏ', 'Z': 'ᴢ'
    };
    return text.split('').map(char => uppercaseMap[char] || char).join('');
};

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
    pattern: "animost",
    alias: ["animestlk", "animostlk", "anime"],
    desc: "Search and download animation movies from AnimostLK",
    category: "download",
    filename: __filename
},
async (conn, mek, m, { from, text, reply, react, socket, sock }) => {
    const client = socket || sock || conn;

    try {
        const q = text ? text.trim() : "";

        if (!q) {
            return reply(
                `❌ *${toStylistUpper('Opps! Title Missing')}* ❌\n\n` +
                `${toStylistUpper('Please provide an animation movie name to search!')}\n` +
                `📌 *${toStylistUpper('Example')}:* \`.animost New\``
            );
        }

        await react("🔍");
        await reply(`🔍 _${toStylistUpper('Searching for')} *"${q}"* ${toStylistUpper('on AnimostLK servers')}..._`);

        const searchApiUrl = `https://vajiraofc-apis.vercel.app/api/animostlk/search`;
        const response = await axios.get(searchApiUrl, {
            params: { apikey: API_KEY, q: q },
            timeout: 30000
        });

        if (response.status !== 200 || !response.data || !response.data.success) {
            await react("❌");
            return reply(`🛸 *${toStylistUpper('API Error')}:* ${toStylistUpper('Server responded with an invalid status.')}`);
        }

        const results = response.data.results || [];
        if (results.length === 0) {
            await react("❌");
            return reply(`🛸 *${toStylistUpper('No Results Found!')}*\n${toStylistUpper('AnimostLK par')} *"${q}"* ${toStylistUpper('naam ki koi animation nahi mili.')}`);
        }

        let listText = `╔═════ ⌈ *⚡ ${toStylistUpper('Animostlk Search')}* ⌋ ═════✧\n`;
        listText += `║ 🔎 *${toStylistUpper('Query')}:* \`${q.toUpperCase()}\`\n`;
        listText += `║ ✨ *${toStylistUpper('Results Found')}:* ${results.length}\n`;
        listText += `╚══════════════════════✧\n\n`;
        listText += `╔═════ ⌈ *📂 ${toStylistUpper('Select Item')}* ⌋ ═════✧\n`;

        const limit = Math.min(results.length, 10);
        for (let i = 0; i < limit; i++) {
            const v = results[i];
            const rawTitle = v.title || 'Unknown Title';
            const title = cleanTitle(rawTitle);
            const displayTitle = title.length > 45 ? title.substring(0, 45) + '...' : title;
            listText += `║ 🎥 *[${i + 1}]* _${displayTitle}_\n`;
            if (i !== limit - 1) listText += `║─────────────────────║\n`;
        }

        listText += `╚══════════════════════✧\n\n`;
        listText += `⚡ *${toStylistUpper('Reply with the item number to view movie details.')}*\n\n`;
        listText += `> 💫 _${toStylistUpper('Powered by Kamran-Md')}_`;

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

                const detailsApiUrl = `https://vajiraofc-apis.vercel.app/api/animostlk/details`;
                const detailResponse = await axios.get(detailsApiUrl, {
                    params: { apikey: API_KEY, url: selected.url },
                    timeout: 30000
                });

                if (detailResponse.status !== 200 || !detailResponse.data || !detailResponse.data.success) {
                    await react("❌");
                    return reply(`❌ *${toStylistUpper('Error')}:* ${toStylistUpper('Failed to pull details for this item.')}`);
                }

                const movieData = detailResponse.data.data || {};
                let downloadLinks = movieData.download_links || [];

                downloadLinks = downloadLinks.filter(dl => dl.url && (dl.url.includes(".mp4") || dl.url.includes("workers.dev") || dl.quality !== "Download Subtitles"));

                if (downloadLinks.length === 0) {
                    await react("❌");
                    return reply(`❌ *${toStylistUpper('Sorry')}:* ${toStylistUpper('No valid video download links were located for this selection.')}`);
                }

                const movieTitleClean = cleanTitle(movieData.title || selected.title);

                let cap = `❖ ── ✦ *${toStylistUpper(movieTitleClean)}* ✦ ── ❖\n\n`;
                
                if (movieData.year) cap += `📅 *${toStylistUpper('Year')}:* ${movieData.year}\n`;
                if (movieData.duration) cap += `⏱️ *${toStylistUpper('Duration')}:* ${movieData.duration}\n\n`;

                cap += `╔═════ ⌈ *⚡ ${toStylistUpper('Available Qualities')}* ⌋ ═════✧\n`;
                
                downloadLinks.forEach((dl, i) => {
                    cap += `║ 🔥 *[${i + 1}]* ${toStylistUpper('Quality')}: \`${dl.quality || 'HD'}\` | ${toStylistUpper('Size')}: \`${dl.size || 'Unknown'}\`\n`;
                    if (i !== downloadLinks.length - 1) cap += `║─────────────────────║\n`;
                });

                cap += `╚══════════════════════✧\n\n`;
                cap += `⚡ *${toStylistUpper('Reply with a quality number to download as Document.')}*\n\n`;
                cap += `> 💫 _${toStylistUpper('Powered by Kamran-Md')}_`;

                const detailImg = movieData.image || "https://i.imgur.com/Te4kE0x.jpeg";

                const sentDetail = await client.sendMessage(from, {
                    image: { url: detailImg },
                    caption: cap
                }, { quoted: msg });

                const detailMsgId = sentDetail.key.id;
                let downloadTimeout;

                const downloadHandler = async (up) => {
                    try {
                        const dlMsg = up.messages[0];
                        if (!dlMsg?.message || dlMsg.key.remoteJid !== from) return;

                        const dlCtx = dlMsg.message.extendedTextMessage?.contextInfo || dlMsg.message.conversation?.contextInfo;
                        if (dlCtx?.stanzaId !== detailMsgId) return;

                        const pick = (dlMsg.message.conversation || dlMsg.message.extendedTextMessage?.text || "").trim();
                        const dlNum = parseInt(pick);
                        if (isNaN(dlNum) || dlNum < 1 || dlNum > downloadLinks.length) return;

                        const selectedLink = downloadLinks[dlNum - 1];
                        if (!selectedLink || !selectedLink.url) return;

                        client.ev.off("messages.upsert", downloadHandler);
                        clearTimeout(downloadTimeout);

                        await client.sendMessage(from, { react: { text: "📥", key: dlMsg.key } });
                        
                        const targetFileUrl = selectedLink.url;
                        const cleanFileName = `${movieTitleClean.replace(/[^a-zA-Z0-9 ]/g, "_")}_${selectedLink.quality || 'HD'}.mp4`;

                        await reply(`🚀 *${toStylistUpper('Processing AnimostLK File')}...* \n${toStylistUpper('Uploading document. Please wait!')}`);

                        let finalCaption = `❖ ── ✦ *${toStylistUpper(movieTitleClean)}* ✦ ── ❖\n\n`;
                        finalCaption += `╔═════ ⌈ *⚡ ${toStylistUpper('File Info')}* ⌋ ═════✧\n`;
                        finalCaption += `║ 🌟 *${toStylistUpper('Quality')}:* ${selectedLink.quality || 'HD'}\n`;
                        finalCaption += `║ 📦 *${toStylistUpper('Size')}:* ${selectedLink.size || 'N/A'}\n`;
                        finalCaption += `╚══════════════════════✧\n\n`;
                        finalCaption += `> 💫 _${toStylistUpper('Powered by Kamran-Md')}_`;

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
                        console.error("AnimostLK download failed:", dlErr.message);
                        reply(`❌ ${toStylistUpper('An error occurred during file delivery')}: ${dlErr.message}`);
                    }
                };

                client.ev.on("messages.upsert", downloadHandler);
                
                downloadTimeout = setTimeout(() => {
                    client.ev.off("messages.upsert", downloadHandler);
                }, 300000);

            } catch (detErr) {
                console.error("AnimostLK details failed:", detErr.message);
                reply(`❌ ${toStylistUpper('An error occurred while loading details')}: ${detErr.message}`);
            }
        };

        client.ev.on("messages.upsert", detailsHandler);
        
        detailsTimeout = setTimeout(() => {
            client.ev.off("messages.upsert", detailsHandler);
        }, 300000);

    } catch (e) {
        console.error("AnimostLK Downloader error:", e.message);
        await react("❌");
        return reply(`❌ *${toStylistUpper('Error Processing Request')}:* ${e.message}`);
    }
});
