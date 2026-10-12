import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "movie1",
    alias: ["ytmovie", "video43", "playvid"],
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

        // Call the API endpoint with headers to avoid 403/blocking
        const encodedQuery = encodeURIComponent(text.trim());
        const apiUrl = `https://api-faa.my.id/faa/ytplayvid?q=${encodedQuery}`;
        
        const response = await axios.get(apiUrl, { 
            timeout: 60000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        
        const resData = response.data;

        if (!resData || !resData.status || !resData.result) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ Could not find any video/movie results for that query.");
        }

        const info = resData.result;
        const videoUrl = info.download_url;
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

        // Send the video file as a document with headers/options if supported, 
        // passing the url directly. WhatsApp's internal downloader will fetch it.
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
