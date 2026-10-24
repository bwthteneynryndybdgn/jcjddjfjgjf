import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import axios from 'axios';
import yts from 'yt-search';

const __filename = fileURLToPath(import.meta.url);
const playlistSessions = new Map();

cmd({ on: "body" }, async (conn, mek, m, { from, body }) => {
    try {
        if (!body) return;
        const text = body.trim().toLowerCase();
        const sender = m.sender || mek.key?.participant || mek.participant || from;
        if (!playlistSessions.has(sender)) return;

        const session = playlistSessions.get(sender);
        if (session.step === 'select_playlist_item') {
            if (text === 'all' || text === 'sari') {
                const playlist = session.playlist;
                playlistSessions.delete(sender);
                await conn.sendMessage(from, { text: `> *BATCH DOWNLOADER* 📥\n\nSari ${playlist.length} videos document mein bheji ja rahi hain!` }, { quoted: mek });

                for (let i = 0; i < playlist.length; i++) {
                    await downloadAndSendDoc(conn, mek, from, playlist[i]);
                    if (i < playlist.length - 1) await new Promise(r => setTimeout(r, 60000));
                }
                return;
            }

            if (/^\d+$/.test(text)) {
                const choice = parseInt(text);
                const playlist = session.playlist;
                if (choice >= 1 && choice <= playlist.length) {
                    const selected = playlist[choice - 1];
                    playlistSessions.delete(sender);
                    await conn.sendMessage(from, { text: `📌 *Selected:* ${selected.title}\n_Document download ho raha hai..._` }, { quoted: mek });
                    await downloadAndSendDoc(conn, mek, from, selected);
                }
            }
        }
    } catch (err) {}
});

cmd({ pattern: "playlist", alias: ["ytslist"], use: '.playlist <query>', category: "downloader", filename: __filename },
async (conn, mek, m, { from, text, reply }) => {
    try {
        const query = String(text || "").trim();
        if (!query) return reply(`⚠️ Usage: .playlist <query>`);
        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        const searchRes = await yts(query);
        const results = (searchRes?.videos || searchRes || []).slice(0, 15);
        if (!results.length) return reply(`❌ Koyi video nahi mili.`);

        const sender = m.sender || mek.key?.participant || mek.participant || from;
        playlistSessions.set(sender, { step: 'select_playlist_item', playlist: results });

        let listText = `> *YOUTUBE PLAYLIST* 🎶\n\n🔍 *Query:* ${query}\n\n`;
        results.forEach((item, index) => {
            listText += `*${index + 1}.* ${item.title}\n⏱️ ${item.timestamp || 'N/A'}\n\n`;
        });
        listText += `• Number reply karein ya **all** likhein!`;

        await conn.sendMessage(from, { text: listText }, { quoted: mek });
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
    } catch (e) { reply(`❌ Error: ${e.message}`); }
});

async function downloadAndSendDoc(conn, mek, from, video) {
    const videoUrl = video.url || `https://youtube.com/watch?v=${video.videoId}`;
    const thumbnail = video.thumbnail || video.image || "";
    const api = `https://api.nexray.eu.cc/downloader/v1/ytmp4?url=${encodeURIComponent(videoUrl)}&resolusi=360`;
    const { data } = await axios.get(api, { timeout: 90000 });
    const resData = data?.result || data;
    const downloadUrl = resData?.url || resData?.downloadUrl;
    const finalTitle = resData?.title || video.title;

    if (!downloadUrl) return;

    let docPayload = {
        document: { url: downloadUrl },
        mimetype: 'video/mp4',
        fileName: `${finalTitle.replace(/[/\\?%*:|"<>]/g, '').trim()}.mp4`,
        caption: `📥 *${finalTitle}*`
    };

    if (thumbnail) {
        try {
            const buf = await axios.get(thumbnail, { responseType: 'arraybuffer' }).then(r => r.data);
            if (buf) docPayload.jpegThumbnail = buf.toString('base64');
        } catch (e) {}
    }
    await conn.sendMessage(from, docPayload, { quoted: mek });
}
