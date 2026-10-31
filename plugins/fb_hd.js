// plugins/fb_hd.js
import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import config from '../config.js';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "fbhd",
    alias: ["fbhigh", "fbdlhd"],
    react: '🎬',
    desc: "Download Facebook Video in HD Quality",
    category: "downloader",
    filename: __filename
}, async (client, message, m, { from, prefix, command, args, q, userConfig }) => {
    try {
        if (!q) return await client.sendMessage(from, { text: `❌ *Please provide a Facebook link.*\n\n*Ex:* ${prefix + command} https://fb.watch/...` }, { quoted: message });

        await client.sendMessage(from, { react: { text: '⏳', key: message.key } });

        const apiUrl = `https://techxkamran.onrender.com/api/download/facebook?url=${encodeURIComponent(q.trim())}`;
        const response = await axios.get(apiUrl, { timeout: 30000 });
        const resData = response.data;

        if (!resData?.data?.downloads) throw new Error("No data found");

        const videoData = resData.data;
        // Force HD logic
        let downloadUrl = videoData.downloads.find(d => d.resolution === "HD" && d.url)?.url;
        let quality = "HD";
        
        if (!downloadUrl) {
            downloadUrl = videoData.downloads.find(d => d.url)?.url;
            quality = "SD";
        }

        if (!downloadUrl) throw new Error("Link not found");

        const caption = `🎬 *FACEBOOK HD DOWNLOADER*\n\n📂 *Title:* ${videoData.title || 'Unknown'}\n📺 *Quality:* ${quality}\n\n_Powered by Bot_`;

        await client.sendMessage(from, {
            video: { url: downloadUrl },
            caption: caption,
            mimetype: 'video/mp4'
        }, { quoted: message });

        await client.sendMessage(from, { react: { text: '✅', key: message.key } });

    } catch (e) {
        console.error(e);
        await client.sendMessage(from, { text: `❌ *Error:* ${e.message}` }, { quoted: message });
    }
});
