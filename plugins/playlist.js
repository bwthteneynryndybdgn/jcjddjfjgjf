import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import axios from 'axios';
import yts from 'yt-search';

const __filename = fileURLToPath(import.meta.url);

const userSessions = new Map();

// ==================== INTERACTIVE BODY LISTENER ====================
cmd({
    on: "body"
}, async (conn, mek, m, { from, body }) => {
    try {
        if (!body) return;
        const text = body.trim().toLowerCase();
        
        const sender = m.sender || mek.key?.participant || mek.participant || from;
        if (!userSessions.has(sender)) return;

        const session = userSessions.get(sender);

        if (session.step === 'select_video') {
            if (text === 'all' || text === 'sari') {
                const playlist = session.playlist;
                userSessions.delete(sender);

                await conn.sendMessage(from, { text: `> *KAMRAN-MD BATCH DOWNLOADER* 📥\n\nSari ${playlist.length} videos aaram se 1 minute ke delay ke sath document mein bheji ja rahi hain. Intezar karein!` }, { quoted: mek });

                for (let i = 0; i < playlist.length; i++) {
                    await conn.sendMessage(from, { text: `⬇️ *Downloading (${i + 1}/${playlist.length}):* ${playlist[i].title}\n_Baraye meharbani intezar karein..._` }, { quoted: mek });
                    await downloadVideoDoc(conn, mek, from, playlist[i]);
                    
                    if (i < playlist.length - 1) {
                        await new Promise(resolve => setTimeout(resolve, 60000)); // 1 minute delay
                    }
                }

                await conn.sendMessage(from, { text: `✅ Mashallah, saari episodes mukammal taur par download ho chuki hain!` }, { quoted: mek });
                return;
            }

            if (/^\d+$/.test(text)) {
                const actualIndex = parseInt(text) - 1;
                const playlist = session.playlist;

                if (actualIndex >= 0 && actualIndex < playlist.length) {
                    const selectedVideo = playlist[actualIndex];
                    userSessions.delete(sender);

                    await conn.sendMessage(from, { text: `> *KAMRAN-MD DOWNLOAD MANAGER* 📥\n\n📌 *Selected:* ${selectedVideo.title}\n_Video Document download ho raha hai, barae meharbani intezar karein..._` }, { quoted: mek });
                    
                    await downloadVideoDoc(conn, mek, from, selectedVideo);
                    return;
                }
            }
        }
    } catch (err) {
        console.error("Playlist Session Error:", err);
    }
});

// ==================== PLAYLIST / SEARCH COMMAND ====================
cmd({
    pattern: "playlist",
    alias: ["ytslist", "all-list", "ytsearch"],
    use: '.playlist <drama name>',
    desc: "Search YouTube properly and download full videos as Document",
    category: "downloader",
    react: "🎶",
    filename: __filename
},
async (conn, mek, m, { from, text, reply }) => {
    try {
        const query = String(text || "").trim();
        if (!query) {
            return reply(`⚠️ *PLAYLIST SEARCH*\n\nUsage:\n• .playlist <drama/song name>\nMisal ke tor par: .playlist Ishq Murshid`);
        }

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        const searchRes = await yts(query);
        // Filter out very short videos (teasers/shorts under 3 minutes) so we get real full episodes
        const rawResults = searchRes?.videos || searchRes || [];
        const results = rawResults.filter(item => {
            const seconds = item.seconds || 0;
            return seconds > 180; // Only keep videos longer than 3 minutes
        }).slice(0, 20);

        if (!results || results.length === 0) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply(`❌ Koyi mukammal episode nahi mila is query ke liye. Kuch behtar naam likhein.`);
        }
        
        const sender = m.sender || mek.key?.participant || mek.participant || from;
        userSessions.set(sender, {
            step: 'select_video',
            playlist: results
        });

        let listText = `> *KAMRAN-MD DRAMA / YOUTUBE PLAYLIST* 🎬\n\n`;
        listText += `🔍 *Query:* ${query}\n\n`;

        results.forEach((item, index) => {
            listText += `*${index + 1}.* ${item.title}\n`;
            listText += `⏱️ *Duration:* ${item.timestamp || item.duration || 'N/A'}\n\n`;
        });

        listText += `_Aapko kya chahiye?_\n`;
        listText += `• Koyi aik number reply karein (misal: **1**)\n`;
        listText += `• Ya phir saari videos document mein lene ke liye **all** likh kar bhejein!`;

        await conn.sendMessage(from, { text: listText }, { quoted: mek });
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
        console.error("[PLAYLIST ERROR]", e);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } }, { quoted: mek });
        return reply(`❌ Error: ${e.message}`);
    }
});

// ==================== HELPER: STRICT VIDEO DOCUMENT DOWNLOAD ====================
async function downloadVideoDoc(conn, mek, from, video) {
    try {
        const videoUrl = video.url || (video.videoId ? `https://youtube.com/watch?v=${video.videoId}` : null);
        if (!videoUrl) {
            return conn.sendMessage(from, { text: `❌ Invalid video URL for: ${video.title || 'Unknown'}` });
        }

        // Using VajiraOfc API with higher quality (480p or 720p) so full episodes download correctly with proper size
        const api = `https://vajiraofc-apis.vercel.app/api/ytmp4?apikey=VajiraOfc&url=${encodeURIComponent(videoUrl)}&quality=480`;
        
        const { data } = await axios.get(api, { 
            timeout: 90000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        const resData = data?.data || data;
        const downloadUrl = resData?.download?.url || resData?.downloadUrl || resData?.url;
        const title = resData?.title || video.title || "video";

        if (!downloadUrl) {
            return conn.sendMessage(from, { text: `❌ Video download link nahi mila: ${title}` });
        }

        // Strictly sending as Document format with correct size & headers
        await conn.sendMessage(from, {
            document: { url: downloadUrl },
            mimetype: 'video/mp4',
            fileName: `${title.replace(/[/\\?%*:|"<>]/g, '').trim()}.mp4`,
            caption: `🎬 *${title}*`
        });
    } catch (e) {
        console.error("Video Document Download Error:", e);
        await conn.sendMessage(from, { text: `❌ Download failed for: ${video.title || 'Video'}\nReason: ${e.message}` });
    }
}
