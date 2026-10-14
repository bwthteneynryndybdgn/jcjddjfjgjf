import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);

// ==================== AUTO BODY MOVIE SEARCH LISTENER ====================
cmd({
    on: "body"
}, async (conn, mek, m, { from, body }) => {
    try {
        if (!body) return;

        const rawText = body.trim();
        const lowerText = rawText.toLowerCase();
        
        const triggers = ['movie ', 'searchmovie ', 'movsearch ', 'film '];
        const matchedTrigger = triggers.find(t => lowerText.startsWith(t));

        if (matchedTrigger) {
            const query = rawText.slice(matchedTrigger.length).trim();
            if (query) {
                await executeMovieSearch(conn, mek, from, query);
            }
        }
    } catch (error) {
        console.error("Auto-Body Movie Search Error:", error);
    }
});

// ==================== MOVIE SEARCH COMMAND (Prefix Version) ====================
cmd({
    pattern: "movie",
    alias: ["searchmovie", "movsearch", "film", "movies"],
    use: '.movie <movie name>',
    desc: "Search movies and send as document using MovieBox API",
    category: "downloader",
    react: "🎬",
    filename: __filename
},
async (conn, mek, m, { from, text, reply }) => {
    try {
        if (!text) {
            return reply(
                `⚠️ Please provide a movie name to search!\n\n` +
                `Example:\n` +
                `• .movie Ghamasaan`
            );
        }

        await executeMovieSearch(conn, mek, from, text.trim());
    } catch (e) {
        console.error("Error in movie command:", e);
        reply(`An error occurred: ${e.message}`);
    }
});

// ==================== CORE MOVIE SEARCH & DOCUMENT LOGIC ====================
async function executeMovieSearch(conn, mek, from, keyword) {
    try {
        // Loading reaction
        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        const encodedKeyword = encodeURIComponent(keyword);
        const apiUrl = `https://api.omegatech.app/api/movie/MovieBox-pro?action=search&keyword=${encodedKeyword}`;
        
        const response = await axios.get(apiUrl, { timeout: 30000 });
        const resData = response.data;

        if (!resData || !resData.success || !resData.data || !resData.data.results || resData.data.results.length === 0) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return await conn.sendMessage(from, { text: `❌ No movies found for "${keyword}".` }, { quoted: mek });
        }

        const movie = resData.data.results[0];

        const title = movie.title || "Unknown Movie";
        const releaseDate = movie.releaseDate || "N/A";
        const genre = movie.genre || "N/A";
        const country = movie.countryName || "N/A";
        const imdb = movie.imdbRatingValue || "N/A";
        const coverUrl = movie.cover?.url || "";
        const downloadUrl = movie.proxyDownload || "";
        const streamUrl = movie.proxyStream || "";

        let caption = `> *KAMRAN-MD MOVIE FINDER* 🍿\n\n`;
        caption += `📌 *Title:* ${title}\n`;
        caption += `📅 *Release:* ${releaseDate}\n`;
        caption += `🎭 *Genre:* ${genre}\n`;
        caption += `🌍 *Country:* ${country}\n`;
        caption += `⭐ *IMDb:* ${imdb}\n\n`;
        if (downloadUrl) caption += `📥 *Download Link:* ${downloadUrl}\n`;
        if (streamUrl) caption += `▶️ *Stream Link:* ${streamUrl}`;

        // 1. Send Cover Thumbnail and Details
        if (coverUrl) {
            await conn.sendMessage(from, { 
                image: { url: coverUrl }, 
                caption: caption 
            }, { quoted: mek });
        } else {
            await conn.sendMessage(from, { text: caption }, { quoted: mek });
        }

        // 2. Send Movie as Document File securely
        if (downloadUrl) {
            await conn.sendMessage(from, { 
                document: { url: downloadUrl },
                mimetype: 'video/mp4',
                fileName: `${title.replace(/[^a-zA-Z0-9]/g, '_')}.mp4`,
                caption: `🎬 *${title}*`
            }, { quoted: mek });
        }

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (error) {
        console.error("Movie Search Error:", error);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        await conn.sendMessage(from, { text: `❌ Error: ${error.message}` }, { quoted: mek });
    }
}
