import { cmd } from '../command.js';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';
import yts from 'yt-search';

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

        // If not a direct YouTube link, use ytsearch
        if (!query.includes("youtu.be") && !query.includes("youtube.com")) {
            try {
                const search = await yts(query);
                if (search && search.videos && search.videos.length > 0) {
                    ytUrl = search.videos[0].url;
                } else {
                    await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
                    return reply("❌ No results found for your query. Please try a different song name.");
                }
            } catch (searchErr) {
                console.error("YTSearch Error:", searchErr);
                return reply("❌ Error occurred while searching YouTube.");
            }
        }

        // Call VajiraOfc API
        let apiUrl = `https://vajiraofc-apis.vercel.app/api/ytmp3?apikey=VajiraOfc&url=${encodeURIComponent(ytUrl)}&quality=92`;

        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`API responded with status code ${response.status}`);
        }

        const json = await response.json();

        // Safe checks to avoid 'undefined' crashes
        if (!json || !json.success || !json.data) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ Invalid response received from the API.");
        }

        const songData = json.data;
        const downloadUrl = songData.download?.url || songData.url;
        const songTitle = songData.title || "Audio Track";
        const quality = songData.download?.quality || "92kbps";

        if (!downloadUrl) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ Download link could not be found in the API response.");
        }

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
        reply(`❌ *Error:* ${error.message || "An unexpected error occurred."}`);
    }
});
