import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);

// ==================== 1. SEARCH MOVIE LISTENER ====================
cmd({
    on: "body"
}, async (conn, mek, m, { from, body }) => {
    try {
        if (!body) return;
        const rawText = body.trim();
        const lowerText = rawText.toLowerCase();
        
        if (lowerText.startsWith('movie ') || lowerText.startsWith('searchmovie ')) {
            const query = rawText.split(' ').slice(1).join(' ').trim();
            if (query) {
                await executeMovieSearch(conn, mek, from, query);
            }
        } else if (lowerText.startsWith('moviedetail ') || lowerText.startsWith('detail ')) {
            const detailPath = rawText.split(' ').slice(1).join(' ').trim();
            if (detailPath) {
                await executeMovieDetail(conn, mek, from, detailPath);
            }
        }
    } catch (error) {
        console.error("Auto-Body Movie Error:", error);
    }
});

// ==================== SEARCH COMMAND (Prefix Version) ====================
cmd({
    pattern: "movie7",
    alias: ["searchmovie", "movsearch", "films"],
    use: '.movie <movie name>',
    desc: "Search movies list using MovieBox API",
    category: "downloader",
    react: "🎬",
    filename: __filename
},
async (conn, mek, m, { from, text, reply }) => {
    try {
        if (!text) {
            return reply(`⚠️ Please provide a movie name to search!\nExample: .movie Spider-Man`);
        }
        await executeMovieSearch(conn, mek, from, text.trim());
    } catch (e) {
        console.error("Error in movie command:", e);
        reply(`An error occurred: ${e.message}`);
    }
});

// ==================== DETAIL COMMAND (Prefix Version) ====================
cmd({
    pattern: "moviedetail",
    alias: ["detail", "movdetail"],
    use: '.moviedetail <detailPath>',
    desc: "Get full details and download links of a selected movie",
    category: "downloader",
    react: "🔍",
    filename: __filename
},
async (conn, mek, m, { from, text, reply }) => {
    try {
        if (!text) {
            return reply(`⚠️ Please provide the detailPath of the movie!\nExample: .moviedetail my-cousin-is-an-escort-kMTF1yOqqV9`);
        }
        await executeMovieDetail(conn, mek, from, text.trim());
    } catch (e) {
        console.error("Error in moviedetail command:", e);
        reply(`An error occurred: ${e.message}`);
    }
});

// ==================== CORE SEARCH LOGIC ====================
async function executeMovieSearch(conn, mek, from, keyword) {
    try {
        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        const apiUrl = `https://api.omegatech.app/api/movie/MovieBox-pro?action=search&keyword=${encodeURIComponent(keyword)}`;
        const response = await axios.get(apiUrl, { timeout: 30000 });
        const resData = response.data;

        if (!resData || !resData.success || !resData.data || !resData.data.results || resData.data.results.length === 0) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return await conn.sendMessage(from, { text: `❌ No movies found for "${keyword}".` }, { quoted: mek });
        }

        const movies = resData.data.results.slice(0, 5); // Top 5 results
        let msg = `> *KAMRAN-MD MOVIE SEARCH RESULTS* 🍿\n\n`;
        msg += `🔍 *Keyword:* ${keyword}\n\n`;

        movies.forEach((movie, index) => {
            msg.format ? null : null;
            msg += `*${index + 1}. ${movie.title}* (${movie.releaseDate || 'N/A'})\n`;
            msg += `🎭 Genre: ${movie.genre || 'N/A'}\n`;
            msg += `⭐ IMDb: ${movie.imdbRatingValue || 'N/A'}\n`;
            msg += `👉 *Get Detail:* \`.moviedetail ${movie.detailPath}\`\n\n`;
        });

        msg += `_Copy the detail command above and send it to get the download & stream links!_`;

        await conn.sendMessage(from, { text: msg }, { quoted: mek });
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (error) {
        console.error("Movie Search Error:", error);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        await conn.sendMessage(from, { text: `❌ Error: ${error.message}` }, { quoted: mek });
    }
}

// ==================== CORE DETAIL & DOWNLOAD LOGIC ====================
async function executeMovieDetail(conn, mek, from, detailPath) {
    try {
        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        // 1. Fetch Detail API
        const detailUrl = `https://api.omegatech.app/api/movie/MovieBox-pro?action=detail&detailPath=${encodeURIComponent(detailPath)}`;
        const detailRes = await axios.get(detailUrl, { timeout: 30000 });
        const detailData = detailRes.data;

        if (!detailData || !detailData.success) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return await conn.sendMessage(from, { text: `❌ Could not fetch details for this movie.` }, { quoted: mek });
        }

        const info = detailData.data || detailData;
        const title = info.title || "Unknown Title";
        const desc = info.description || "No description available.";
        const release = info.releaseDate || "N/A";
        const genre = info.genre || "N/A";
        const cover = info.cover?.url || info.cover || "";
        const subjectId = info.subjectId || "";

        // 2. Fetch Download/Stream links using action=download or proxy links
        let downloadLink = info.proxyDownload || "";
        let streamLink = info.proxyStream || "";

        if (!downloadLink && subjectId) {
            const dlApi = `https://api.omegatech.app/api/movie/MovieBox-pro?action=download&subjectId=${subjectId}&detailPath=${encodeURIComponent(detailPath)}`;
            try {
                const dlRes = await axios.get(dlApi, { timeout: 30000 });
                if (dlRes.data && dlRes.data.success) {
                    downloadLink = dlRes.data.data?.downloadUrl || dlRes.data.downloadUrl || "";
                }
            } catch (err) {
                console.log("Download fetch sub-error:", err.message);
            }
        }

        let caption = `> *KAMRAN-MD MOVIE DETAILS* 🎬\n\n`;
        caption += `📌 *Title:* ${title}\n`;
        caption += `📅 *Release:* ${release}\n`;
        caption += `🎭 *Genre:* ${genre}\n`;
        caption += `📝 *Description:* ${desc}\n\n`;
        if (streamLink) caption += `▶️ *Stream:* ${streamLink}\n`;
        if (downloadLink) caption += `📥 *Download:* ${downloadLink}\n`;

        if (cover) {
            await conn.sendMessage(from, { 
                image: { url: cover }, 
                caption: caption 
            }, { quoted: mek });
        } else {
            await conn.sendMessage(from, { text: caption }, { quoted: mek });
        }

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (error) {
        console.error("Movie Detail Error:", error);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        await conn.sendMessage(from, { text: `❌ Error: ${error.message}` }, { quoted: mek });
    }
}
