import { cmd } from '../command.js';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';
import yts from 'yt-search'; // yt-search package zaroori hai

const __filename = fileURLToPath(import.meta.url);

// Aapke diye gaye APIs ki list
const APIS = (queryOrUrl) => [
  `https://kiraxmd-api.vercel.app/api/play?query=${encodeURIComponent(queryOrUrl)}`,
  `https://xenoytdl-2.vercel.app/api/youtube?url=${encodeURIComponent(queryOrUrl)}`,
  `https://jerrycoder.oggyapi.workers.dev/down/ytmp3-v1?url=${encodeURIComponent(queryOrUrl)}`,
  `https://api.siputzx.my.id/api/d/ytmp3?url=${encodeURIComponent(queryOrUrl)}`,
  `https://eliteprotech-apis.zone.id/ytdown?format=mp3&url=${encodeURIComponent(queryOrUrl)}`,
];

cmd({
    pattern: "play2",
    alias: ["song2", "audio2", "ytmp32"],
    desc: "Search and download songs from YouTube with image and multi-APIs.",
    category: "downloader",
    react: "🎵",
    filename: __filename
}, async (conn, mek, m, { from, text, reply }) => {

    if (!text) return reply("❌ Please provide a song name or YouTube URL!\n\n*Example:* `.play pal pal` or `.play https://youtu.be/...`");

    try {
        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        let query = text.trim();
        let targetParam = query;
        let thumbnail = null;
        let songTitle = "Audio Track";
        let downloadUrl = null;

        // Agar user ne direct link nahi diya, toh yt-search se video ki detail aur link nikalenge
        if (!query.includes("youtu.be") && !query.includes("youtube.com")) {
            try {
                const search = await yts(query);
                if (search && search.videos && search.videos.length > 0) {
                    const video = search.videos[0];
                    targetParam = video.url; // Kuch APIs ke liye URL
                    thumbnail = video.thumbnail;
                    songTitle = video.title;
                }
            } catch (err) {
                console.error("YTSearch Error:", err);
            }
        }

        // Agar yt-search se thumbnail na mile toh fallback set kar dein
        if (!thumbnail && targetParam.includes("youtube")) {
            const videoIdMatch = targetParam.match(/(?:v=|youtu\.be\/)([\w-]{11})/);
            if (videoIdMatch) {
                thumbnail = `https://i.ytimg.com/vi/${videoIdMatch[1]}/hqdefault.jpg`;
            }
        }

        // Multi-API fallback loop
        const apiList = APIS(targetParam);
        
        for (const apiUrl of apiList) {
            try {
                const response = await fetch(apiUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
                if (!response.ok) continue;
                const json = await response.json();
                
                // Alag-alag APIs ke response structures ko handle karne ke checks
                const dUrl = json.data?.download?.url || json.data?.url || json.url || json.download || json.audio || json.mp3;
                if (dUrl) {
                    downloadUrl = dUrl;
                    if (json.data?.title) songTitle = json.data.title;
                    if (json.data?.thumbnail) thumbnail = json.data.thumbnail;
                    break;
                }
            } catch (err) {
                console.log(`API Failed, trying next...`);
            }
        }

        if (!downloadUrl) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ Sabhi APIs down hain ya audio fetch nahi ho saka. Barah-e-karam baad mein koshish karein.");
        }

        const infoMessage = `🎵 *KAMRAN-MD PLAYER*\n\n` +
            `*Title:* ${songTitle}\n\n` +
            `━━━━━━━━━━━━━━━━━━\n` +
            `~ *KAMRAN-MD*`;

        // Pehle Image aur Title/Details bhejein ge
        if (thumbnail) {
            await conn.sendMessage(from, {
                image: { url: thumbnail },
                caption: infoMessage
            }, { quoted: mek });
        } else {
            await reply(infoMessage);
        }

        // Phir Audio file send karenge
        await conn.sendMessage(from, {
            audio: { url: downloadUrl },
            mimetype: 'audio/mp4',
            fileName: `${songTitle.replace(/[\\/:*?"<>|]/g, '')}.mp3`,
            ptt: false
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (error) {
        console.error("Play Command Error:", error);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        reply(`❌ *Error:* ${error.message}`);
    }
});
