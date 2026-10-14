import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);

// Temporary memory store to keep search results for selection
const searchSessions = new Map();

// ==================== AUTO BODY & SELECTION LISTENER ====================
cmd({
    on: "body"
}, async (conn, mek, m, { from, body }) => {
    try {
        if (!body) return;
        const rawText = body.trim();
        const lowerText = rawText.toLowerCase();

        // 1. Search Trigger
        const triggers = ['movie ', 'searchmovie ', 'movsearch ', 'film '];
        const matchedTrigger = triggers.find(t => lowerText.startsWith(t));

        if (matchedTrigger) {
            const query = rawText.slice(matchedTrigger.length).trim();
            if (query) {
                await executeMovieSearch(conn, mek, from, query);
            }
            return;
        }

        // 2. Number Selection Trigger (e.g., replying "1", "2", "3" to select movie)
        if (searchSessions.has(from) && /^[1-5]$/.test(rawText)) {
            const session = searchSessions.get(from);
            // Check if session is within 2 minutes
            if (Date.now() - session.timestamp < 120000) {
                const selectedIndex = parseInt(rawText) - 1;
                const chosenMovie = session.movies[selectedIndex];

                if (chosenMovie) {
                    searchSessions.delete(from); // Clear session
                    await executeMovieDetailAndDownload(conn, mek, from, chosenMovie, mek);
                }
            } else {
                searchSessions.delete(from);
            }
        }
    } catch (error) {
        console.error("Auto-Body Movie Flow Error:", error);
    }
});

// ==================== MOVIE SEARCH COMMAND (Prefix Version) ====================
cmd({
    pattern: "movie",
    alias: ["searchmovie", "movsearch", "film", "movies"],
    use: '.movie <movie name>',
    desc: "Search movies and select to download via MovieBox API",
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
                `• .movie Spider-Man`
            );
        }

        await executeMovieSearch(conn, mek, from, text.trim());
    } catch (e) {
        console.error("Error in movie command:", e);
        reply(`An error occurred: ${e.message}`);
    }
});

// ==================== STEP 1: SEARCH & SHOW LIST ====================
async function executeMovieSearch(conn, mek, from, keyword) {
    try {
        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        const encodedKeyword = encodeURIComponent(keyword);
        const apiUrl = `https://api.omegatech.app/api/movie/MovieBox-pro?action=search&keyword=${encodedKeyword}`;
        
        const response = await axios.get(apiUrl, { timeout: 30000 });
        const resData = response.data;

        if (!resData || !resData.success || !resData.data || !resData.data.results || resData.data.results.length === 0) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return await conn.sendMessage(from, { text: `❌ No movies found for "${keyword}".` }, { quoted: mek });
        }

        const movies = resData.data.results.slice(0, 5); // Top 5 results

        // Save session for selection
        searchSessions.set(from, {
            movies: movies,
            timestamp: Date.now()
        });

        let msg = `> *KAMRAN-MD MOVIE SELECTOR* 🍿\n\n`;
        msg += `🔍 *Search:* ${keyword}\n`;
        msg += `📌 *Reply with a number (1 to ${movies.length}) to select & download:* \n\n`;

        movies.forEach((movie, index) => {
            msg += `*${index + 1}. ${movie.title}* (${movie.releaseDate || 'N/A'})\n`;
            msg += `🎭 Genre: ${movie.genre || 'N/A'}\n`;
            msg += `⭐ IMDb: ${movie.imdbRatingValue || 'N/A'}\n\n`;
        });

        msg += `_👉 Just reply with the number (e.g. 1) to get details and download the movie document!_`;

        await conn.sendMessage(from, { text: msg }, { quoted: mek });
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (error) {
        console.error("Movie Search Error:", error);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        await conn.sendMessage(from, { text: `❌ Error: ${error.message}` }, { quoted: mek });
    }
}

// ==================== STEP 2: DETAIL & DOCUMENT DOWNLOAD ====================
async function executeMovieDetailAndDownload(conn, mek, from, movie, quotedMek) {
    try {
        await conn.sendMessage(from, { react: { text: "⏳", key: quotedMek.key } });

        const detailPath = movie.detailPath;
        const subjectId = movie.subjectId;

        // 1. Fetch Detail API
        const detailUrl = `https://api.omegatech.app/api/movie/MovieBox-pro?action=detail&detailPath=${encodeURIComponent(detailPath)}`;
        const detailRes = await axios.get(detailUrl, { timeout: 30000 });
        const detailData = detailRes.data;

        const info = detailData?.success ? (detailData.data || detailData) : movie;
        const title = info.title || movie.title || "Movie";
        const desc = info.description || "No description available.";
        const release = info.releaseDate || movie.releaseDate || "N/A";
        const genre = info.genre || movie.genre || "N/A";
        const cover = info.cover?.url || movie.cover?.url || "";

        let caption = `> *KAMRAN-MD MOVIE DETAILS* 🎬\n\n`;
        caption += `📌 *Title:* ${title}\n`;
        caption += `📅 *Release:* ${release}\n`;
        caption += `🎭 *Genre:* ${genre}\n`;
        caption += `📝 *Description:* ${desc}\n\n`;
        caption += `📁 *Status:* Fetching official download link & size...`;

        // Send Details & Thumbnail first
        if (cover) {
            await conn.sendMessage(from, { 
                image: { url: cover }, 
                caption: caption 
            }, { quoted: quotedMek });
        } else {
            await conn.sendMessage(from, { text: caption }, { quoted: quotedMek });
        }

        // 2. Fetch Official Download Link using action=download
        let downloadUrl = movie.proxyDownload || "";
        if (subjectId && detailPath) {
            try {
                const dlApi = `https://api.omegatech.app/api/movie/MovieBox-pro?action=download&subjectId=${subjectId}&detailPath=${encodeURIComponent(detailPath)}`;
                const dlRes = await axios.get(dlApi, { timeout: 30000 });
                const dlData = dlRes.data;
                if (dlData && dlData.success) {
                    const dlInfo = dlData.data || dlData;
                    downloadUrl = dlInfo.downloadUrl || dlInfo.proxyDownload || dlInfo.url || downloadUrl;
                }
            } catch (dlErr) {
                console.log("Download link fetch sub-error:", dlErr.message);
            }
        }

        if (!downloadUrl) {
            await conn.sendMessage(from, { react: { text: "❌", key: quotedMek.key } });
            return await conn.sendMessage(from, { text: `❌ Could not retrieve download link for this movie.` }, { quoted: quotedMek });
        }

        await conn.sendMessage(from, { text: `📥 *Downloading movie document, please wait...*` }, { quoted: quotedMek });

        // 3. Send as Document (.mp4)
        await conn.sendMessage(from, {
            document: { url: downloadUrl },
            mimetype: 'video/mp4',
            fileName: `${title.replace(/[^a-zA-Z0-9]/g, '_')}.mp4`,
            caption: `🎬 *${title}*`
        }, { quoted: quotedMek });

        await conn.sendMessage(from, { react: { text: "✅", key: quotedMek.key } });

    } catch (error) {
        console.error("Movie Detail & Download Error:", error);
        await conn.sendMessage(from, { react: { text: "❌", key: quotedMek.key } });
        await conn.sendMessage(from, { text: `❌ Error: ${error.message}` }, { quoted: quotedMek });
    }
}
