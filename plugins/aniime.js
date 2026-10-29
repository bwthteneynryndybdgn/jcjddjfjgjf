//---------------------------------------------------------------------------
//           KAMRAN-MD - GENSHIN IMPACT COSPLAY PLUGIN (FIXED)
//---------------------------------------------------------------------------

import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);

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
    pattern: "genshincos",
    alias: ["genshin", "gcosplay"],
    use: '.genshincos',
    desc: "Fetch Genshin Impact cosplay image via Shizo API",
    category: "anime",
    react: "👘",
    filename: __filename
},
async (conn, mek, m, { from, reply, react }) => {
    try {
        await react("🔍");
        await conn.sendPresenceUpdate('composing', from);
        await reply(`🔍 _${toStylistUpper('Fetching Genshin Impact cosplay image')}..._`);

        const apiUrl = `https://api.shizo.top/cosplay/genshin-impact/asuma?apikey=shizo`;
        const response = await axios.get(apiUrl, { timeout: 30000 });
        const resData = response.data;

        // API response ke har possible path ko check karna
        const imageUrl = resData?.url || resData?.result || resData?.data?.url || resData?.data;

        if (!imageUrl || typeof imageUrl !== 'string' || !imageUrl.startsWith('http')) {
            await react("❌");
            return reply(`🛸 *${toStylistUpper('Failed to fetch cosplay image from API!')}*\n\n_API Response:_ \`${JSON.stringify(resData)}\``);
        }

        await react("📥");
        await conn.sendPresenceUpdate('composing', from);

        let finalCaption = `❖ ── ✦ *${toStylistUpper('Genshin Impact Cosplay')}* ✦ ── ❖\n\n`;
        finalCaption += `> 💫 _${toStylistUpper('Powered by Kamran-Md')}_`;

        await conn.sendMessage(from, {
            image: { url: imageUrl },
            caption: finalCaption,
            contextInfo: { mentionedJid: [mek.sender] }
        }, { quoted: mek });

        await react("✅");

    } catch (e) {
        console.error("Genshin Cosplay Error:", e.message);
        await react("❌");
        return reply(`❌ *${toStylistUpper('Error Processing Request')}:* ${e.message}`);
    }
});
