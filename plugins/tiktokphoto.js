//---------------------------------------------------------------------------
//           KAMRAN-MD - TIKTOK PHOTO DIRECT DOWNLOADER PLUGIN
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
    pattern: "tiktokphoto",
    alias: ["ttphoto", "tiktokimg", "ttimg"],
    use: '.tiktokphoto <query>',
    desc: "Directly download TikTok photo carousels without selection",
    category: "downloader",
    react: "📸",
    filename: __filename
},
async (conn, mek, m, { from, text, reply, react }) => {
    try {
        const query = String(text || "").trim();
        if (!query) {
            let helpMsg = `❖ ── ✦ *${toStylistUpper('TikTok Photo Downloader')}* ✦ ── ❖\n\n`;
            helpMsg += `╔═════ ⌈ *⚡ ${toStylistUpper('Usage Guide')}* ⌋ ═════✧\n`;
            helpMsg += `║ 📌 *${toStylistUpper('Example')}:*\n`;
            helpMsg += `║ • .tiktokphoto Cat food\n`;
            helpMsg += `╚══════════════════════✧\n\n`;
            helpMsg += `> 💫 _${toStylistUpper('Powered by Kamran-Md')}_`;
            return reply(helpMsg);
        }

        await react("🔍");
        await reply(`🔍 _${toStylistUpper('Fetching TikTok photos for')} *"${query}"*..._`);

        const apiUrl = `https://api.nexray.eu.cc/search/tiktokphoto?q=${encodeURIComponent(query)}`;
        const response = await axios.get(apiUrl, { timeout: 30000 });
        const resData = response.data;

        if (!resData || !resData.status || !resData.result || resData.result.length === 0) {
            await react("❌");
            return reply(`🛸 *${toStylistUpper('No Results Found!')}*\n${toStylistUpper('TikTok par')} *"${query}"* ${toStylistUpper('se related koi photos nahi mili.')}`);
        }

        // Direct pehli post utha li jaye gi bina kisi selection ke
        const selectedPost = resData.result[0];
        if (!selectedPost || !selectedPost.images || selectedPost.images.length === 0) {
            await react("❌");
            return reply(`❌ *${toStylistUpper('No images found in the top result.')}*`);
        }

        await react("📥");
        await reply(`🚀 *${toStylistUpper('Downloading TikTok Photos')}...* \n${toStylistUpper('Sending images, please wait!')}`);

        const authorInfo = selectedPost.author?.nickname ? `@${selectedPost.author.nickname}` : 'TikTok Creator';
        
        let finalCaption = `❖ ── ✦ *${toStylistUpper('TikTok Photo Post')}* ✦ ── ❖\n\n`;
        finalCaption += `👤 *${toStylistUpper('Creator')}:* ${authorInfo}\n`;
        finalCaption += `❤️ *Likes:* ${selectedPost.stats?.likes || '0'} | 💬 *Comments:* ${selectedPost.stats?.comment || '0'}\n\n`;
        if (selectedPost.title && selectedPost.title.trim()) {
            const shortDesc = selectedPost.title.length > 200 ? selectedPost.title.substring(0, 200) + '...' : selectedPost.title;
            finalCaption += `📌 *${toStylistUpper('Caption')}:* ${shortDesc}\n\n`;
        }
        finalCaption += `> 💫 _${toStylistUpper('Powered by Kamran-Md')}_`;

        const imagesList = selectedPost.images;
        for (let i = 0; i < imagesList.length; i++) {
            const imgUrl = imagesList[i];
            await conn.sendMessage(from, {
                image: { url: imgUrl },
                caption: i === 0 ? finalCaption : `🖼️ *Photo ${i + 1} of ${imagesList.length}*`
            }, { quoted: mek });
        }

        await react("✅");

    } catch (e) {
        console.error("TikTok Photo Error:", e.message);
        await react("❌");
        return reply(`❌ *${toStylistUpper('Error Processing Request')}:* ${e.message}`);
    }
});
