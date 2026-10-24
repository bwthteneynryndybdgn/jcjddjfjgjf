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
            // Agar user "all" likhe toh saari videos ek-ek karke download hongi
            if (text === 'all' || text === 'sari') {
                const playlist = session.playlist;
                userSessions.delete(sender);

                await conn.sendMessage(from, { text: `> *KAMRAN-MD BATCH DOWNLOADER* 📥\n\nSari ${playlist.length} videos/episodes ek-ek karke video document mein bheji ja rahi hain. Intezar karein!` }, { quoted: mek });

                for (let i = 0; i < playlist.length; i++) {
                    await conn.sendMessage(from, { text: `⬇️ *Downloading (${i + 1}/${playlist.length}):* ${playlist[i].title}` }, { quoted: mek });
                    await downloadVideoDoc(conn, mek, from, playlist[i]);
                    await new Promise(resolve => setTimeout(resolve, 3000));
                }

                await conn.sendMessage(from, { text: `✅ All episodes successfully downloaded!` }, { quoted: mek });
                return;
            }

            // Agar user koi aik number select kare (misal: 1, 2, 3...)
            if (/^\d+$/.test(text)) {
                const actualIndex = parseInt(text) - 1;
                const playlist = session.playlist;

                if (actualIndex >= 0 && actualIndex < playlist.length) {
                    const selectedVideo = playlist[actualIndex];
                    userSessions.delete(sender);

                    await conn.sendMessage(from, { text: `> *KAMRAN-MD DOWNLOAD MANAGER* 📥\n\n📌 *Selected:* ${selectedVideo.title}\n_Video document download ho raha hai, barae meharbani intezar karein..._` }, { quoted: mek });
                    
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
    desc: "Search YouTube using ytsearch, show playlist, and download single or all videos as Video Document",
    category: "downloader",
    react: "🎶",
    filename: __filename
},
async (conn, mek, m, { from, text, reply }) => {
    try {
        const query = String(text || "").trim();
        if (!query) {
            return reply(`⚠️ *PLAYLIST SEARCH*\n\nUsage:\n• .playlist <drama/song name>\nMisal ke tor par: .playlist Ishq Murshid ep 1`);
        }

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        // Using yt-search package properly
        const searchRes = await yts(query);
        const results = (searchRes?.videos || searchRes || []).slice(0, 20);

        if (!results || results.length === 0) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply(`❌ Koyi video ya drama nahi mila is query ke liye.`);
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
        listText += `• Ya phir saari videos download karne ke liye **all** likh kar bhejein!`;

        await conn.sendMessage(from, { text: listText }, { quoted: mek });
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
        console.error("[PLAYLIST ERROR]", e);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        return reply(`❌ Error: ${e.message}`);
    }
});

// ==================== HELPER: DOWNLOAD VIDEO DOCUMENT ====================
async function downloadVideoDoc(conn, mek, from, video) {
    try {
        const videoUrl = video.url || `https://youtube.com/watch?v=${video.videoId}`;
        const api = `https://api.omegatech.app/api/download/yt-dl?action=download&url=${encodeURIComponent(videoUrl)}&quality=360p`;
        const { data } = await axios.get(api, { timeout: 45000 });

        const resData = data?.data;
        const downloadUrl = resData?.downloadUrl || resData?.url;
        const title = resData?.title || video.title || "video";

        if (!downloadUrl) {
            return conn.sendMessage(from, { text: `❌ Video download link nahi mila: ${title}` }, { quoted: mek });
        }

        await conn.sendMessage(from, {
            document: { url: downloadUrl },
            mimetype: 'video/mp4',
            fileName: `${title.replace(/[/\\?%*:|"<>]/g, '')}.mp4`,
            caption: `🎬 ${title}`
        }, { quoted: mek });
    } catch (e) {
        console.error("Video Download Error:", e);
        await conn.sendMessage(from, { text: `❌ Error downloading video: ${e.message}` }, { quoted: mek });
    }
}
