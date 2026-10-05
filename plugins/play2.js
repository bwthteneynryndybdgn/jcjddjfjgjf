import { cmd } from '../command.js';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "play44",
    alias: ["song55", "audio", "ytmp3"],
    desc: "Download and play songs from YouTube.",
    category: "downloader",
    react: "🎵",
    filename: __filename
}, async (conn, mek, m, { from, text, reply }) => {

    if (!text) return reply("❌ Please provide a song name or YouTube URL!\n\n*Example:* `.play Faded`");

    try {
        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        let query = text.trim();
        let downloadUrl = null;
        let songTitle = "Audio Track";

        // ── API Endpoint List (Primary + Fallbacks) ──
        const apis = [
            `https://vajiraofc-apis.vercel.app/api/ytmp3?apikey=VajiraOfc&url=${encodeURIComponent(query)}&quality=92`,
            // You can add working alternative APIs here if you have them, for example:
            // `https://api.siputzx.my.id/api/s/youtube?query=${encodeURIComponent(query)}`
        ];

        let json = null;
        for (const apiUrl of apis) {
            try {
                const response = await fetch(apiUrl, {
                    headers: { 'User-Agent': 'Mozilla/5.0' }
                });
                if (response.ok) {
                    const resJson = await response.json();
                    if (resJson && (resJson.success || resJson.status === 200) && (resJson.data?.download?.url || resJson.data?.url)) {
                        json = resJson;
                        break;
                    }
                }
            } catch (e) {
                console.log(`API failed, trying next...`);
            }
        }

        // If all APIs fail, try a general search or notify user
        if (!json) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ The downloader API is currently down or unresponsive. Please try again later or update the API link.");
        }

        // Extract data based on your API structure
        const songData = json.data;
        downloadUrl = songData.download?.url || songData.url;
        songTitle = songData.title || "Unknown Title";

        if (!downloadUrl) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ Failed to retrieve download link from the API response.");
        }

        const infoMessage = `🎵 *KAMRAN-MD PLAYER*\n\n` +
            `*Title:* ${songTitle}\n\n` +
            `━━━━━━━━━━━━━━━━━━\n` +
            `~ *KAMRAN-MD*`;

        // Send the audio file
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
        reply(`❌ *Error:* ${error.message || "Something went wrong."}`);
    }
});
