// plugins/fb_stylish.js
import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import config from '../config.js';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);

// Helper for Stylish Text
const toStylist = (text) => {
    if (!text) return '';
    const map = {
        'a': 'ᴀ', 'b': 'ʙ', 'c': 'ᴄ', 'd': 'ᴅ', 'e': 'ᴇ', 'f': 'ғ', 'g': 'ɢ', 'h': 'ʜ', 'i': 'ɪ',
        'j': 'ᴊ', 'k': 'ᴋ', 'l': 'ʟ', 'm': 'ᴍ', 'n': 'ɴ', 'o': 'ᴏ', 'p': 'ᴘ', 'q': 'ǫ', 'r': 'ʀ',
        's': 's', 't': 'ᴛ', 'u': 'ᴜ', 'v': 'ᴠ', 'w': 'ᴡ', 'x': 'x', 'y': 'ʏ', 'z': 'ᴢ'
    };
    return text.toLowerCase().split('').map(c => map[c] || c).join('');
};

cmd({
    pattern: "fbsty",
    alias: ["fbstyle", "fbs"],
    react: '✨',
    desc: "Download FB Video with Stylish Caption",
    category: "downloader",
    filename: __filename
}, async (client, message, m, { from, prefix, command, q, userConfig }) => {
    try {
        if (!q) return await client.sendMessage(from, { text: `❌ *${toStylist('provide link first')}*` }, { quoted: message });

        await client.sendMessage(from, { react: { text: '⏳', key: message.key } });

        const apiUrl = `https://techxkamran.onrender.com/api/download/facebook?url=${encodeURIComponent(q.trim())}`;
        const { data } = await axios.get(apiUrl, { timeout: 30000 });

        if (!data?.data?.downloads) throw new Error("API Error");

        const vid = data.data;
        const dl = vid.downloads.find(d => d.resolution === "HD") || vid.downloads.find(d => d.url);
        
        if (!dl?.url) throw new Error("No Link");

        const cap = `❖─── ✦ *${toStylist('Facebook Downloader')}* ✦ ───❖\n\n╔══ ⌈ *${toStylist('Details')}* ⌋ ══✧\n║ 🏷️ *${toStylist('Title')}:* ${vid.title}\n║ 📺 *${toStylist('Quality')}:* ${dl.resolution || 'SD'}\n╚══════════════════✧\n\n> _${userConfig?.DESCRIPTION || 'Bot Name'}_`;

        await client.sendMessage(from, {
            video: { url: dl.url },
            caption: cap,
            mimetype: 'video/mp4'
        }, { quoted: message });

        await client.sendMessage(from, { react: { text: '✅', key: message.key } });

    } catch (e) {
        await client.sendMessage(from, { text: `❌ *${toStylist('Failed')}:* ${e.message}` }, { quoted: message });
    }
});
