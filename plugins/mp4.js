import { cmd } from '../command.js';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);

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
        }

        // VajiraOfc API se audio download link fetch karenge
        let apiUrl = `https://vajiraofc-apis.vercel.app/api/ytmp3?apikey=VajiraOfc&url=${encodeURIComponent(ytUrl)}&quality=92`;

        const response = await fetch(apiUrl);
        const json = await response.json();

        if (!json || !json.success || !json.data || !json.data.download || !json.data.download.url) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ Failed to fetch audio from the API.");
        }

        const songData = json.data;
        const downloadUrl = songData.download.url;
        const songTitle = songData.title || "Audio Track";
        const quality = songData.download.quality || "92kbps";
        
        // Fallback thumbnail if search didn't provide one
        if (!thumbnail) {
            thumbnail = `https://i.ytimg.com/vi/${songData.id || "qF-JLqKtr2Q"}/hqdefault.jpg`;
        }

        const infoMessage = `🎵 *KAMRAN-MD PLAYER*\n\n` +
            `*Title:* ${songTitle}\n` +
            `*Quality:* ${quality}\n\n` +
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
