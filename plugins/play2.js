import { cmd } from '../command.js';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';
import yts from 'yt-search'; // Make sure yt-search is installed in your package.json

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "play",
    alias: ["song", "audio", "ytmp3"],
    desc: "Search and download songs from YouTube.",
    category: "downloader",
    react: "🎵",
    filename: __filename
}, async (conn, mek, m, { from, text, reply }) => {

    if (!text) return reply("❌ Please provide a song name or YouTube URL!\n\n*Example:* `.play Faded`");

    try {
        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        let query = text.trim();
        let ytUrl = query;

        // Check if the input is NOT a direct YouTube URL, then use ytsearch
        if (!query.includes("youtu.be") && !query.includes("youtube.com")) {
            const search = await yts(query);
            if (!search || !search.videos || search.videos.length === 0) {
                await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
                return reply("❌ No results found for your query. Please try a different song name.");
            }
            ytUrl = search.videos[0].url; // Get the first video URL from search
        }

        // Call your VajiraOfc API with the URL
        let apiUrl = `https://vajiraofc-apis.vercel.app/api/ytmp3?apikey=VajiraOfc&url=${encodeURIComponent(ytUrl)}&quality=92`;

        const response = await fetch(apiUrl);
        const json = await response.json();

        if (!json || !json.success || !json.data || !json.data.download || !json.data.download.url) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ Failed to fetch audio from API.");
        }

        const songData = json.data;
        const downloadUrl = songData.download.url;
        const songTitle = songData.title || "Audio Track";
        const quality = songData.download.quality || "92kbps";

        const infoMessage = `🎵 *KAMRAN-MD PLAYER*\n\n` +
            `*Title:* ${songTitle}\n` +
            `*Quality:* ${quality}\n\n` +
            `━━━━━━━━━━━━━━━━━━\n` +
            `~ *KAMRAN-MD*`;

        // Send audio file
        await conn.sendMessage(from, {
            audio: { url: downloadUrl },
            mimetype: 'audio/mp4',
            fileName: `${songTitle.replace(/[\\/:*?"<>|]/g, '')}.mp3`,
            caption: infoMessage,
            ptt: false
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (error) {
        console.error("Play Command Error:", error);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        reply(`❌ *Error:* ${error.message}`);
    }
});
