//---------------------------------------------------------------------------
//           KAMRAN-MD - WEATHER SEARCH PLUGIN
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
    pattern: "weather",
    alias: ["wsearch", "weathersearch"],
    use: '.weather <city name>',
    desc: "Search weather locations and coordinates via Omegatech API",
    category: "tools",
    react: "🌤️",
    filename: __filename
},
async (conn, mek, m, { from, text, reply }) => {
    try {
        const query = String(text || "").trim();
        if (!query) {
            let helpMsg = `❖ ── ✦ *${toStylistUpper('Weather Search')}* ✦ ── ❖\n\n`;
            helpMsg += `╔═════ ⌈ *⚡ ${toStylistUpper('Usage Guide')}* ⌋ ═════✧\n`;
            helpMsg += `║ 📌 *${toStylistUpper('Example')}:*\n`;
            helpMsg += `║ • .weather Lahore\n`;
            helpMsg += `╚══════════════════════✧\n\n`;
            helpMsg += `> 💫 _${toStylistUpper('Powered by Kamran-Md')}_`;
            return reply(helpMsg);
        }

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        const apiUrl = `https://api.omegatech.app/api/Search/weather?action=search&query=${encodeURIComponent(query)}&lang=en`;
        const response = await axios.get(apiUrl, { timeout: 30000 });
        const resData = response.data;

        if (!resData || !resData.success || !resData.data || resData.data.length === 0) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply(`❌ *${toStylistUpper('No weather locations found for this query.')}*`);
        }

        const locations = resData.data;

        let listText = `❖ ── ✦ *${toStylistUpper('Weather Locations')}* ✦ ── ❖\n\n`;
        listText += `╔═════ ⌈ *⚡ ${toStylistUpper('Search Info')}* ⌋ ═════✧\n`;
        listText += `║ 🔎 *${toStylistUpper('Query')}:* ${query}\n`;
        listText += `║ ✨ *${toStylistUpper('Results Found')}:* ${locations.length}\n`;
        listText += `╚══════════════════════✧\n\n`;
        listText += `╔═════ ⌈ *📂 ${toStylistUpper('Locations List')}* ⌋ ═════✧\n`;

        locations.forEach((loc, index) => {
            listText += `║ *${index + 1}.* ${loc.name} (${loc.country})\n`;
            listText += `║ 🔑 *${toStylistUpper('Key')}:* \`${loc.key}\`\n`;
            listText += `║ 🌐 *${toStylistUpper('Coords')}:* ${loc.lat}, ${loc.lon}\n`;
            if (index !== locations.length - 1) listText += `║─────────────────────║\n`;
        });

        listText += `╚══════════════════════✧\n\n`;
        listText += `> 💫 _${toStylistUpper('Powered by Kamran-Md')}_`;

        await conn.sendMessage(from, { 
            text: listText,
            contextInfo: { mentionedJid: [mek.sender] }
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
        console.error("Weather Search Error:", e);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        return reply(`❌ Error: ${e.message}`);
    }
});
