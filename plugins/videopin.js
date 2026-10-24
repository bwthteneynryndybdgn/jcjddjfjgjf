//---------------------------------------------------------------------------
//           KAMRAN-MD - PINTEREST INTERACTIVE DOWNLOADER PLUGIN
//---------------------------------------------------------------------------

import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);

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
    pattern: "pinsearch",
    alias: ["pinterest", "pinvid"],
    use: '.pinsearch <query>',
    desc: "Search and download videos from Pinterest via API",
    category: "downloader",
    react: "📌",
    filename: __filename
},
async (conn, mek, m, { from, text, reply, react, socket, sock }) => {
    const client = socket || sock || conn;

    try {
        const query = String(text || "").trim();
        if (!query) {
            return reply(
                `❌ *${toStylistUpper('Opps! Query Missing')}* ❌\n\n` +
                `${toStylistUpper('Please provide a search query for Pinterest videos!')}\n` +
                `📌 *${toStylistUpper('Example')}:* \`.pinsearch Cat food\``
            );
        }

        await react("🔍");
        await reply(`🔍 _${toStylistUpper('Searching for')} *"${query}"* ${toStylistUpper('on Pinterest servers')}..._`);

        const apiUrl = `https://api.nexray.eu.cc/search/pinterestvideo?q=${encodeURIComponent(query)}`;
        const response = await axios.get(apiUrl, { timeout: 30000 });
        const resData = response.data;

        if (!resData || !resData.status || !resData.result || resData.result.length === 0) {
            await react("❌");
            return reply(`🛸 *${toStylistUpper('No Results Found!')}*\n${toStylistUpper('Pinterest par')} *"${query}"* ${toStylistUpper('se related koi video nahi mili.')}`);
        }

        const videos = resData.result.slice(0, 10);

        let listText = `╔═════ ⌈ *⚡ ${toStylistUpper('Pinterest Search')}* ⌋ ═════✧\n`;
        listText += `║ 🔎 *${toStylistUpper('Query')}:* \`${query.toUpperCase()}\`\n`;
        listText += `║ ✨ *${toStylistUpper('Results Found')}:* ${videos.length}\n`;
        listText += `╚══════════════════════✧\n\n`;
        listText += `╔═════ ⌈ *📂 ${toStylistUpper('Select Video')}* ⌋ ═════✧\n`;

        videos.forEach((item, index) => {
            const cleanTitle = item.title && item.title.trim() ? item.title.trim() : 'Pinterest Video';
            const displayTitle = cleanTitle.length > 40 ? cleanTitle.substring(0, 40) + '...' : cleanTitle;
            listText += `║ 🎥 *[${index + 1}]* _${displayTitle}_\n`;
            if (index !== videos.length - 1) listText += `║─────────────────────║\n`;
        });

        listText += `╚══════════════════════✧\n\n`;
        listText += `⚡ *${toStylistUpper('Reply with the item number to download video.')}*\n\n`;
        listText += `> 💫 _${toStylistUpper('Powered by Kamran-Md')}_`;

        const sentSearch = await client.sendMessage(from, {
            text: listText,
            contextInfo: { mentionedJid: [mek.sender] }
        }, { quoted: mek });

        const searchMsgId = sentSearch.key.id;
        let detailsTimeout;

        const downloadHandler = async (update) => {
            try {
                const msg = update.messages[0];
                if (!msg?.message || msg.key.remoteJid !== from) return;

                const ctx = msg.message.extendedTextMessage?.contextInfo || msg.message.conversation?.contextInfo;
                if (!ctx || ctx.stanzaId !== searchMsgId) return;

                const choice = (msg.message.conversation || msg.message.extendedTextMessage?.text || "").trim();
                const num = parseInt(choice);
                if (isNaN(num) || num < 1 || num > videos.length) return;
                
                const selectedVideo = videos[num - 1];
                if (!selectedVideo || !selectedVideo.video_url) return;

                client.ev.off("messages.upsert", downloadHandler);
                clearTimeout(detailsTimeout);

                await client.sendMessage(from, { react: { text: "📥", key: msg.key } });
                await reply(`🚀 *${toStylistUpper('Processing Pinterest Video')}...* \n${toStylistUpper('Sending video. Please wait!')}`);

                const videoTitle = selectedVideo.title && selectedVideo.title.trim() ? selectedVideo.title.trim() : 'Pinterest Video';
                
                let finalCaption = `❖ ── ✦ *${toStylistUpper(videoTitle)}* ✦ ── ❖\n\n`;
                if (selectedVideo.description && selectedVideo.description.trim()) {
                    finalCaption += `📌 *${toStylistUpper('Description')}:* ${selectedVideo.description.trim()}\n\n`;
                }
                finalCaption += `> 💫 _${toStylistUpper('Powered by Kamran-Md')}_`;

                await client.sendMessage(from, {
                    video: { url: selectedVideo.video_url },
                    caption: finalCaption,
                    mimetype: "video/mp4",
                    contextInfo: { mentionedJid: [msg.sender] }
                }, { quoted: msg });

                await client.sendMessage(from, { react: { text: "✅", key: msg.key } });

            } catch (dlErr) {
                console.error("Pinterest download failed:", dlErr.message);
                reply(`❌ ${toStylistUpper('An error occurred during video delivery')}: ${dlErr.message}`);
            }
        };

        client.ev.on("messages.upsert", downloadHandler);
        
        detailsTimeout = setTimeout(() => {
            client.ev.off("messages.upsert", downloadHandler);
        }, 300000);

    } catch (e) {
        console.error("Pinterest Search Error:", e.message);
        await react("❌");
        return reply(`❌ *${toStylistUpper('Error Processing Request')}:* ${e.message}`);
    }
});
