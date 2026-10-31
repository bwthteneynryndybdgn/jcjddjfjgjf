// plugins/fb_pro.js
import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import config from '../config.js';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "fbpro",
    alias: ["fbpremium", "fbfull"],
    react: '💎',
    desc: "Premium Facebook Video Downloader",
    category: "downloader",
    filename: __filename
}, async (client, message, m, { from, prefix, command, q, userConfig }) => {
    try {
        if (!q) return await client.sendMessage(from, { text: `💎 *PRO DOWNLOADER*\n\nPlease send a valid FB link.` }, { quoted: message });

        await client.sendMessage(from, { react: { text: '💎', key: message.key } });

        const apiUrl = `https://techxkamran.onrender.com/api/download/facebook?url=${encodeURIComponent(q.trim())}`;
        const { data } = await axios.get(apiUrl, { timeout: 30000 });

        if (!data?.status) throw new Error("Service Unavailable");

        const vid = data.data;
        // Try HD first, else SD
        const dl = vid.downloads.find(d => d.resolution === "HD") || vid.downloads[0];
        
        if (!dl?.url) throw new Error("Download Failed");

        const desc = userConfig?.DESCRIPTION || "Kamran-Md";

        const caption = `╭━━━〔 *𝐅𝐁 𝐏𝐑𝐎* 〕━━━┈⊷
┃ 📥 *Status:* Success
┃ 🎬 *Title:* ${vid.title}
┃ 📺 *Quality:* ${dl.resolution || 'Auto'}
╰━━━━━━━━━━━━━━┈⊷

🔹 *Downloader:* ${desc}
🔹 *Command:* .fbpro`;

        await client.sendMessage(from, {
            video: { url: dl.url },
            caption: caption,
            mimetype: 'video/mp4',
            contextInfo: {
                forwardingScore: 999,
                isForwarded: true
            }
        }, { quoted: message });

        await client.sendMessage(from, { react: { text: '✨', key: message.key } });

    } catch (e) {
        await client.sendMessage(from, { text: `❌ *Pro Error:* ${e.message}` }, { quoted: message });
    }
});
