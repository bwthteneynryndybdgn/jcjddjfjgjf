import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "play53",
    alias: ["ytplay", "song64", "plays5"],
    desc: "Search and download songs from YouTube via Kamran API",
    category: "downloader",
    react: "🎵",
    filename: __filename
}, async (conn, mek, m, { from, text, reply }) => {
    try {
        if (!text) {
            return reply(
                `⚠️ Please provide a song name or search query!\n\n` +
                `Example:\n` +
                `• .play Song pal`
            );
        }

        // Loading reaction
        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        const encodedQuery = encodeURIComponent(text.trim());
        const apiUrl = `https://dr-kamran-sites.vercel.app/api/download/ytplay?q=${encodedQuery}`;
        
        const response = await axios.get(apiUrl, { timeout: 30000 });
        const resData = response.data;

        if (!resData || !resData.status) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ Could not find any results for that song.");
        }

        const title = resData.title || text;
        const channel = resData.channel || '';
        const duration = resData.duration || '';
        const views = resData.views || '';
        const thumbnail = resData.thumbnail || '';
        const ytLink = resData.download_url || resData.url || '';

        if (!ytLink) {
             return reply("❌ YouTube video link nahi mil saka.");
        }

        let caption = `🎶 *Title:* ${title}\n`;
        if (channel) caption += `👤 *Channel:* ${channel}\n`;
        if (duration) caption += `⏱️ *Duration:* ${duration}\n`;
        if (views) caption += `👁️ *Views:* ${views}\n`;
        caption += `✨ *Creator:* ${resData.creator || "DRKAMRAN"}\n`;

        if (thumbnail && thumbnail.trim() !== "") {
            await conn.sendMessage(from, { 
                image: { url: thumbnail }, 
                caption: caption + `\n📁 *Status:* Sending audio...` 
            }, { quoted: mek });
        } else {
            await reply(caption + `\n📁 *Status:* Sending audio...`);
        }

        let directAudioUrl = '';

        // SaveTube endpoint try karte hain jo behtar direct link deta hai
        try {
            const saveTubeApi = `https://dr-kamran-sites.vercel.app/api/download/savetube?url=${encodeURIComponent(ytLink)}&quality=mp3`;
            const saveRes = await axios.get(saveTubeApi, { timeout: 30000 });
            
            if (saveRes.data && saveRes.data.status) {
                const saveResult = saveRes.data.result || saveRes.data.data || saveRes.data;
                directAudioUrl = saveResult.download_url || saveResult.downloadUrl || saveResult.mp3 || saveResult.url || '';
            }
        } catch (e) {
            console.log("SaveTube fallback failed.");
        }

        // Agar SaveTube se bhi na mile toh YTMP3 try karein
        if (!directAudioUrl || directAudioUrl.includes("youtube.com/watch")) {
            try {
                const ytmp3Api = `https://dr-kamran-sites.vercel.app/api/download/ytmp3?url=${encodeURIComponent(ytLink)}`;
                const mp3Res = await axios.get(ytmp3Api, { timeout: 30000 });
                
                if (mp3Res.data && mp3Res.data.status) {
                    const mp3Result = mp3Res.data.result || mp3Res.data.data || mp3Res.data;
                    directAudioUrl = mp3Result.download_url || mp3Result.downloadUrl || mp3Result.mp3 || mp3Result.url || '';
                }
            } catch (e) {
                console.log("YTMP3 fallback failed.");
            }
        }

        if (!directAudioUrl) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ Audio stream fetch nahi ho saki, link expire ho gaya hai.");
        }

        // Send the audio file using buffer or direct stream url
        await conn.sendMessage(from, {
            audio: { url: directAudioUrl },
            mimetype: 'audio/mpeg',
            ptt: false 
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (error) {
        console.error("YTPlay Fatal Error:", error);
        reply(`❌ Error: ${error.message}`);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
    }
});
