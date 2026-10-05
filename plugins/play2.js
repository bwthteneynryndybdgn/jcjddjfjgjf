import { cmd } from '../command.js';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "play55",
    alias: ["song", "audio", "ytmp3"],
    desc: "Download and play songs from YouTube using VajiraOfc API.",
    category: "downloader",
    react: "🎵",
    filename: __filename
}, async (conn, mek, m, { from, text, reply }) => {

    if (!text) return reply("❌ Please provide a song name or YouTube URL!\n\n*Example:* `.play Faded`");

    try {
        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        let ytUrl = text.trim();

        // If the user entered a search query instead of a direct URL, you can optionally search or let the API handle it if it supports searches. 
        // (Note: If the API only accepts direct YouTube URLs, make sure to pass a valid link or use a search API first).
        // For demonstration, let's assume if it doesn't start with http, we search for it or pass it directly.
        // If your API specifically requires a YouTube URL, you might want to integrate a search helper or prompt users for a link.
        
        // Let's encode the URL properly for the API request:
        const apiUrl = `https://vajiraofc-apis.vercel.app/api/ytmp3?apikey=VajiraOfc&url=${encodeURIComponent(ytUrl)}&quality=92`;

        const response = await fetch(apiUrl);
        const json = await response.json();

        if (!json.success || !json.data || !json.data.download || !json.data.download.url) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ Failed to fetch audio. Please check your query or try again later.");
        }

        const songData = json.data;
        const downloadInfo = songData.download;

        // Message caption with details
        const infoMessage = `🎵 *KAMRAN-MD PLAYER*\n\n` +
            `*Title:* ${songData.title}\n` +
            `*Quality:* ${downloadInfo.quality}\n` +
            `*URL:* ${songData.url}\n\n` +
            `━━━━━━━━━━━━━━━━━━\n` +
            `~ *KAMRAN-MD*`;

        // Send thumbnail/info text first or send audio directly with caption
        await conn.sendMessage(from, {
            audio: { url: downloadInfo.url },
            mimetype: 'audio/mp4',
            fileName: `${songData.title}.mp3`,
            caption: infoMessage,
            ptt: false // Set to true if you want it as a voice note (audio memo)
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (error) {
        console.error("Play Command Error:", error);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        reply(`❌ *Error:* ${error.message}`);
    }
});
