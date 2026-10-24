import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);

const userSessions = new Map();

// ==================== INTERACTIVE BODY LISTENER ====================
cmd({
    on: "body"
}, async (conn, mek, m, { from, body, sender }) => {
    try {
        if (!body) return;
        const text = body.trim();
        if (!userSessions.has(sender)) return;

        const session = userSessions.get(sender);

        // Step 1: User selects video number from the 20 playlist list
        if (session.step === 'select_video' && /^\d+$/.test(text)) {
            const actualIndex = parseInt(text) - 1;
            const playlist = session.playlist;

            if (actualIndex >= 0 && actualIndex < playlist.length) {
                const selectedVideo = playlist[actualIndex];
                
                userSessions.set(sender, {
                    step: 'select_format',
                    selectedVideo: selectedVideo
                });

                let msg = `> *KAMRAN-MD DOWNLOAD MANAGER* 📥\n\n`;
                msg += `📌 *Selected:* ${selectedVideo.title}\n`;
                msg += `🔗 *URL:* ${selectedVideo.url}\n\n`;
                msg += `Ab aap kis format mein download karna chahte hain? Niche diye gaye number ka reply karein:\n\n`;
                msg += `1️⃣ *Audio Document* (MP3)\n`;
                msg += `2️⃣ *Video Document* (MP4)\n\n`;
                msg += `_Apna jawab **1** ya **2** likh kar bhejein!_`;

                await conn.sendMessage(from, { text: msg }, { quoted: mek });
                return;
            }
        }

        // Step 2: User selects format (1 for Audio, 2 for Video)
        if (session.step === 'select_format') {
            const selectedVideo = session.selectedVideo;
            const choice = text.toLowerCase();

            if (choice === '1' || choice === 'audio' || choice === 'mp3') {
                userSessions.delete(sender);
                await downloadAudioDoc(conn, mek, from, selectedVideo);
            } else if (choice === '2' || choice === 'video' || choice === 'mp4') {
                userSessions.delete(sender);
                await downloadVideoDoc(conn, mek, from, selectedVideo);
            }
        }
    } catch (err) {
        console.error("Playlist Session Error:", err);
    }
});

// ==================== PLAYLIST / SEARCH COMMAND ====================
cmd({
    pattern: "playlist",
    alias: ["ytslist", "all-list"],
    use: '.playlist <song name>',
    desc: "Search YouTube, show 20 results playlist, then choose format to download as Document",
    category: "downloader",
    react: "🎶",
    filename: __filename
},
async (conn, mek, m, { from, text, reply, sender }) => {
    try {
        const query = String(text || "").trim();
        if (!query) {
            return reply(`⚠️ *PLAYLIST SEARCH*\n\nUsage:\n• .playlist <song name>\nMisal ke tor par: .playlist Song pal`);
        }

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        const searchApi = `https://api.azbry.com/api/search/yts?q=${encodeURIComponent(query)}`;
        const { data: searchRes } = await axios.get(searchApi, { timeout: 30000 });

        if (!searchRes || !searchRes.result || searchRes.result.length === 0) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply(`❌ Koyi video nahi mili is query ke liye.`);
        }

        const results = searchRes.result.slice(0, 20);
        
        userSessions.set(sender, {
            step: 'select_video',
            playlist: results
        });

        let listText = `> *KAMRAN-MD YOUTUBE PLAYLIST (20 RESULTS)* 🎶\n\n`;
        listText += `🔍 *Query:* ${query}\n\n`;

        results.forEach((item, index) => {
            listText += `*${index + 1}.* ${item.title}\n`;
            listText += `⏱️ *Duration:* ${item.duration || 'N/A'} | 👁️ *Views:* ${item.views || 'N/A'}\n\n`;
        });

        listText += `_Apni pasand ka number reply karein (**1** se **20** tak), uske baad aapko Audio ya Video Document ka option mil jayega!_`;

        await conn.sendMessage(from, { text: listText }, { quoted: mek });
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
        console.error("[PLAYLIST ERROR]", e);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        return reply(`❌ Error: ${e.message}`);
    }
});

// ==================== HELPER: DOWNLOAD AUDIO DOCUMENT ====================
async function downloadAudioDoc(conn, mek, from, video) {
    try {
        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        const api = `https://api.azbry.com/api/download/ytmp3?url=${encodeURIComponent(video.url)}`;
        const { data } = await axios.get(api, { timeout: 40000 });

        console.log("YTMP3 API Response:", data); // Debugging ke liye

        const downloadUrl = data?.result?.download || data?.download || data?.url;
        const title = data?.result?.title || video.title || "audio";
        const thumb = data?.result?.thumbnail || video.thumbnail;

        if (!downloadUrl) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return conn.sendMessage(from, { text: `❌ Audio download link nahi mila.` }, { quoted: mek });
        }

        let caption = `> *KAMRAN-MD AUDIO DOCUMENT* 🎧\n\n`;
        caption += `📌 *Title:* ${title}\n\n`;
        caption += `_Aapka audio document bheja ja raha hai..._`;

        if (thumb) {
            await conn.sendMessage(from, { image: { url: thumb }, caption: caption }, { quoted: mek });
        }

        await conn.sendMessage(from, {
            document: { url: downloadUrl },
            mimetype: 'audio/mpeg',
            fileName: `${title.replace(/[/\\?%*:|"<>]/g, '')}.mp3`,
            caption: `🎵 ${title}`
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
    } catch (e) {
        console.error("Audio Download Error:", e);
        await conn.sendMessage(from, { text: `❌ Error: ${e.message}` }, { quoted: mek });
    }
}

// ==================== HELPER: DOWNLOAD VIDEO DOCUMENT ====================
async function downloadVideoDoc(conn, mek, from, video) {
    try {
        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        const api = `https://api.azbry.com/api/download/ytmp4?url=${encodeURIComponent(video.url)}`;
        const { data } = await axios.get(api, { timeout: 40000 });

        console.log("YTMP4 API Response:", data); // Debugging ke liye

        const downloadUrl = data?.result?.download || data?.download || data?.url;
        const title = data?.result?.title || video.title || "video";
        const thumb = data?.result?.thumbnail || video.thumbnail;

        if (!downloadUrl) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return conn.sendMessage(from, { text: `❌ Video download link nahi mila.` }, { quoted: mek });
        }

        let caption = `> *KAMRAN-MD VIDEO DOCUMENT* 📥\n\n`;
        caption += `📌 *Title:* ${title}\n\n`;
        caption += `_Aapka video document bheja ja raha hai..._`;

        if (thumb) {
            await conn.sendMessage(from, { image: { url: thumb }, caption: caption }, { quoted: mek });
        }

        await conn.sendMessage(from, {
            document: { url: downloadUrl },
            mimetype: 'video/mp4',
            fileName: `${title.replace(/[/\\?%*:|"<>]/g, '')}.mp4`,
            caption: `🎬 ${title}`
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
    } catch (e) {
        console.error("Video Download Error:", e);
        await conn.sendMessage(from, { text: `❌ Error: ${e.message}` }, { quoted: mek });
    }
}
