import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "movie1",
    alias: ["ytmovie2", "video2", "playvid2"],
    desc: "Search and download movies/videos from YouTube via FAA API",
    category: "downloader",
    react: "🎬",
    filename: __filename
}, async (conn, mek, m, { from, text, reply }) => {
    try {
        if (!text) {
            return reply(
                `⚠️ Please provide a movie name or search query!\n\n` +
                `Example:\n` +
                `• .movie DJ Hindi`
            );
        }

        // Loading reaction
        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        // Call the API endpoint for video playback
        const encodedQuery = encodeURIComponent(text.trim());
        const apiUrl = `https://api-faa.my.id/faa/ytplayvid?q=${encodedQuery}`;
        
        const response = await axios.get(apiUrl, { timeout: 60000 });
        const resData = response.data;

        // Check if API returned success and result object
        if (!resData || !resData.status || !resData.result) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ Could not find any video/movie results for that query.");
        }

        const info = resData.result;
        const videoUrl = info.download_url; // Exact key from API response
        const title = info.searched_title || text;
        const sourceUrl = info.searched_url || '';

        if (!videoUrl) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ Failed to retrieve the video download link from the API response.");
        }

        // Prepare info caption
        let caption = `🎥 *Title:* ${title}\n`;
        if (sourceUrl) caption += `🔗 *YouTube Link:* ${sourceUrl}\n`;
        caption += `📁 *Status:* Sending movie/video as document...`;

        await reply(caption);

        // Send the video file as a document
        await conn.sendMessage(from, {
            document: { url: videoUrl },
            mimetype: 'video/mp4',
            fileName: `${title.replace(/[^a-zA-Z0-9]/g, '_')}.mp4`,
            caption: `🎬 Here is your movie/video: *${title}*`
        }, { quoted: mek });

        // Success reaction
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (error) {
        console.error("YTMovie Error:", error);
        reply(`❌ Error: ${error.message}`);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
    }
});
