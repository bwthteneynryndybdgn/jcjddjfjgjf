//---------------------------------------------------------------------------
//           KAMRAN-MD - PINTEREST VIDEO SEARCH PLUGIN
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

cmd({
    pattern: "pinsearchv",
    alias: ["pinterestv", "pinvid"],
    use: '.pinsearch <query>',
    desc: "Search videos from Pinterest via API",
    category: "downloader",
    react: "📌",
    filename: __filename
},
async (conn, mek, m, { from, text, reply }) => {
    try {
        const query = String(text || "").trim();
        if (!query) {
            return reply(`⚠️ *${toStylistUpper('Usage')}:* .pinsearch <query>\n\n*${toStylistUpper('Example')}:* \`.pinsearch Cat food\``);
        }

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        const apiUrl = `https://api.nexray.eu.cc/search/pinterestvideo?q=${encodeURIComponent(query)}`;
        const response = await axios.get(apiUrl, { timeout: 30000 });
        const resData = response.data;

        if (!resData || !resData.status || !resData.result || resData.result.length === 0) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply(`❌ *${toStylistUpper('No Pinterest videos found for this query.')}*`);
        }

        const videos = resData.result.slice(0, 10); // Displaying top 10 results

        let listText = `❖ ── ✦ *${toStylistUpper('Pinterest Video Search')}* ✦ ── ❖\n\n`;
        listText += `╔═════ ⌈ *⚡ ${toStylistUpper('Search Info')}* ⌋ ═════✧\n`;
        listText += `║ 🔎 *${toStylistUpper('Query')}:* ${query}\n`;
        listText += `║ ✨ *${toStylistUpper('Total Found')}:* ${resData.result.length}\n`;
        listText += `╚══════════════════════✧\n\n`;
        listText += `╔═════ ⌈ *📂 ${toStylistUpper('Top Results')}* ⌋ ═════✧\n`;

        videos.forEach((item, index) => {
            const cleanTitle = item.title && item.title.trim() ? item.title.trim() : 'Pinterest Video';
            const displayTitle = cleanTitle.length > 40 ? cleanTitle.substring(0, 40) + '...' : cleanTitle;
            listText += `║ *${index + 1}.* ${displayTitle}\n`;
            listText += `║ 🔗 \`${item.video_url || item.url}\`\n`;
            if (index !== videos.length - 1) listText += `║─────────────────────║\n`;
        });

        listText += `╚══════════════════════✧\n\n`;
        listText += `> 💫 _${toStylistUpper('Powered by Kamran-Md')}_`;

        await conn.sendMessage(from, { 
            text: listText,
            contextInfo: { mentionedJid: [mek.sender] }
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
        console.error("Pinterest Search Error:", e);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        return reply(`❌ Error: ${e.message}`);
    }
});
