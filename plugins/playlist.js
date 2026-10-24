import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import axios from 'axios';

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

                await conn.sendMessage(from, { text: `> *KAMRAN-MD BATCH DOWNLOADER* 📥\n\nSari ${playlist.length} episodes aaram se 1 minute ke delay ke sath document mein bheji ja rahi hain. Intezar karein!` }, { quoted: mek });

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
                const userChoice = parseInt(text);
                const playlist = session.playlist;

                if (userChoice >= 1 && userChoice <= playlist.length) {
                    const selectedVideo = playlist[userChoice - 1];
                    userSessions.delete(sender);

                    await conn.sendMessage(from, { text: `> *KAMRAN-MD DOWNLOAD MANAGER* 📥\n\n📌 *Selected:* ${selectedVideo.title}\n_Video Document download ho raha hai, barae meharbani intezar karein..._` }, { quoted: mek });
                    
                    await downloadVideoDoc(conn, mek, from, selectedVideo);
                    return;
                } else {
                    return conn.sendMessage(from, { text: `⚠️ Baraye meharbani 1 se ${playlist.length} ke darmiyan koi number select karein.` }, { quoted: mek });
                }
            }
        }
    } catch (err) {
        console.error("Playlist Session Error:", err);
    }
});

// ==================== PLAYLIST / SEARCH COMMAND (VajiraOfc Search API) ====================
cmd({
    pattern: "playlist",
    alias: ["ytslist", "all-list", "ytsearch"],
    use: '.playlist <drama name>',
    desc: "Search YouTube using VajiraOfc Search API and download exact videos as Document",
    category: "downloader",
    react: "🎶",
    filename: __filename
},
async (conn, mek, m, { from, text, reply }) => {
    try {
        const query = String(text || "").trim();
        if (!query) {
            return reply(`⚠️ *PLAYLIST SEARCH*\n\nUsage:\n• .playlist <drama/song name>\nMisal ke tor par: .playlist Drama mohabbat`);
        }

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        // Using VajiraOfc official search API endpoint
        const searchApi = `https://vajiraofc-apis.vercel.app/api/ytsearch?apikey=VajiraOfc&q=${encodeURIComponent(query)}`;
        const { data: searchRes } = await axios.get(searchApi, { timeout: 30000 });

        const rawResults = searchRes?.results || [];

        if (!rawResults || rawResults.length === 0) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply(`❌ Koyi video nahi mili is query ke liye.`);
        }

        // Filter out teasers/promos (duration format check: "MM:SS" or skip short clips under 3 minutes)
        const results = rawResults.filter(item => {
            const durStr = item.description?.duration || "0:00";
            const parts = durStr.split(":");
            if (parts.length === 2) {
                const minutes = parseInt(parts[0]) || 0;
                return minutes >= 3; // Keep only videos >= 3 minutes (full episodes)
            }
            return true;
        }).slice(0, 20);

        if (results.length === 0) {
            return reply(`❌ Koyi mukammal episode nahi mila. Koshish karein ke poora naam likhein.`);
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
            listText += `⏱️ *Duration:* ${item.description?.duration || 'N/A'} | 👁️ *Views:* ${item.description?.views || 'N/A'}\n\n`;
        });

        listText += `_Aapko kya chahiye?_\n`;
        listText += `• Koyi aik number reply karein (misal: **1**)\n`;
        listText += `• Ya phir saari episodes document mein lene ke liye **all** likh kar bhejein!`;

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
        const videoUrl = video.url || `https://youtube.com/watch?v=${video.id}`;
        if (!videoUrl) {
            return conn.sendMessage(from, { text: `❌ Invalid video URL for: ${video.title || 'Unknown'}` });
        }

        const api = `https://vajiraofc-apis.vercel.app/api/ytmp4?apikey=VajiraOfc&url=${encodeURIComponent(videoUrl)}&quality=360`;
        
        const { data } = await axios.get(api, { 
            timeout: 60000,
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
