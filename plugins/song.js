import { cmd } from '../command.js';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);

// Aapke diye gaye multi APIs list
const APIS = (url) => [
  `https://kiraxmd-api.vercel.app/api/play?query=${encodeURIComponent(url)}`,
  `https://xenoytdl-2.vercel.app/api/youtube?url=${encodeURIComponent(url)}`,
  `https://jerrycoder.oggyapi.workers.dev/down/ytmp3-v1?url=${encodeURIComponent(url)}`,
  `https://api.siputzx.my.id/api/d/ytmp3?url=${encodeURIComponent(url)}`,
  `https://eliteprotech-apis.zone.id/ytdown?format=mp3&url=${encodeURIComponent(url)}`,
  `https://vajiraofc-apis.vercel.app/api/ytmp3?apikey=VajiraOfc&url=${encodeURIComponent(url)}&quality=92`
];

cmd({
    pattern: "play",
    alias: ["song", "audio", "ytmp3"],
    desc: "Search or download songs from YouTube with image and details.",
    category: "downloader",
    react: "🎵",
    filename: __filename
}, async (conn, mek, m, { from, text, reply }) => {

    if (!text) return reply("❌ Please provide a song name or YouTube URL!\n\n*Example:* `.play pal pal` or `.play https://youtu.be/...`");

    try {
        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        let query = text.trim();
        let ytUrl = query;
        let thumbnail = null;
        let songTitle = "Audio Track";
        let downloadUrl = null;

        // Agar user ne link nahi diya, toh search API se link aur thumbnail nikal lenge
        if (!query.includes("youtu.be") && !query.includes("youtube.com")) {
            const searchApi = `https://api.siputzx.my.id/api/s/youtube?query=${encodeURIComponent(query)}`;
            const searchRes = await fetch(searchApi);
            const searchJson = await searchRes.json();

            if (!searchJson || !searchJson.status || !searchJson.data || searchJson.data.length === 0) {
                await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
                return reply("❌ No results found for your query. Please try another song name.");
            }

            ytUrl = searchJson.data[0].url;
            thumbnail = searchJson.data[0].thumbnail || searchJson.data[0].image;
            songTitle = searchJson.data[0].title || query;
        }

        // Multi-API Fallback Loop
        const apiList = APIS(ytUrl);
        
        for (const apiUrl of apiList) {
            try {
                const response = await fetch(apiUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
                if (!response.ok) continue;
                const json = await response.json();

                const dUrl = json.data?.download?.url || json.data?.url || json.url || json.download || json.audio || json.mp3 || json.result?.mp3 || json.result?.url;
                
                if (dUrl && typeof dUrl === "string" && dUrl.startsWith("http")) {
                    downloadUrl = dUrl;
                    if (json.data?.title) songTitle = json.data.title;
                    if (json.result?.title) songTitle = json.result.title;
                    if (json.data?.thumbnail) thumbnail = json.data.thumbnail;
                    break;
                }
            } catch (err) {
                console.log("API trying next...");
            }
        }

        if (!downloadUrl) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ Failed to fetch audio from all APIs. Please try again later.");
        }

        // Fallback thumbnail
        if (!thumbnail) {
            const videoIdMatch = ytUrl.match(/(?:v=|youtu\.be\/)([\w-]{11})/);
            const videoId = videoIdMatch ? videoIdMatch[1] : "qF-JLqKtr2Q";
            thumbnail = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
        }

        const infoMessage = `🎵 *KAMRAN-MD PLAYER*\n\n` +
            `*Title:* ${songTitle}\n\n` +
            `━━━━━━━━━━━━━━━━━━\n` +
            `~ *KAMRAN-MD*`;

        // Pehle Image + Caption bhejein ge
        if (thumbnail) {
            await conn.sendMessage(from, {
                image: { url: thumbnail },
                caption: infoMessage
            }, { quoted: mek });
        } else {
            await reply(infoMessage);
        }

        // Phir direct audio url pass karenge taake WhatsApp khud handle kare
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
        reply(`❌ *Error:* ${error.message || "An unexpected error occurred."}`);
    }
});
