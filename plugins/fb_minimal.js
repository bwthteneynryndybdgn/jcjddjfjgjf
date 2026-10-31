// plugins/fb_minimal.js
import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "fbmini",
    alias: ["fbm", "fbfast"],
    react: '🚀',
    desc: "Fast Facebook Video Download",
    category: "downloader",
    filename: __filename
}, async (client, message, m, { from, prefix, command, q }) => {
    try {
        if (!q) return await client.sendMessage(from, { text: `*_Usage:_ ${prefix+command} <url>` }, { quoted: message });

        await client.sendMessage(from, { react: { text: '🔄', key: message.key } });

        const apiUrl = `https://techxkamran.onrender.com/api/download/facebook?url=${encodeURIComponent(q.trim())}`;
        const { data } = await axios.get(apiUrl, { timeout: 20000 });

        const link = data?.data?.downloads?.find(d => d.url)?.url;
        const title = data?.data?.title || "Video";

        if (!link) throw new Error("Invalid Link");

        // Minimal Caption using Monospace font simulation
        const caption = `\`\`\`FB DOWNLOADER\`\`\`\n\n📄 Title: ${title}\n🔗 Source: Facebook`;

        await client.sendMessage(from, {
            video: { url: link },
            caption: caption,
            mimetype: 'video/mp4'
        }, { quoted: message });

        await client.sendMessage(from, { react: { text: '✔️', key: message.key } });

    } catch (e) {
        await client.sendMessage(from, { text: `❌ Error: ${e.message}` }, { quoted: message });
    }
});
