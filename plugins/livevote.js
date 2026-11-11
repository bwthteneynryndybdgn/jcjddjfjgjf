import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "play533",
    alias: ["ytplay", "song", "plays"],
    desc: "Search and download songs from YouTube via FAA API",
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

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        const encodedQuery = encodeURIComponent(text.trim());
        const apiUrl = `https://api.nexray.eu.cc/downloader/ytplay?q=${encodedQuery}`;
        
        const response = await axios.get(apiUrl, { timeout: 30000 });
        const resData = response.data;

        if (!resData?.status || !resData?.result?.download_url) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ Could not find any results for that song.");
        }

        const info = resData.result;
        const audioUrl = info.download_url;
        const title = info.title || text;
        const thumbnail = info.thumbnail || '';
        const duration = info.duration || '';
        const author = info.channel || '';

        // Send metadata first so user sees progress while we proxy-download
        let caption = `🎶 *Title:* ${title}\n`;
        if (author) caption += `👤 *Artist/Channel:* ${author}\n`;
        if (duration) caption += `⏱️ *Duration:* ${duration}\n`;
        caption += `📁 *Status:* Fetching audio...`;

        if (thumbnail) {
            await conn.sendMessage(from, { 
                image: { url: thumbnail }, 
                caption: caption 
            }, { quoted: mek });
        } else {
            await reply(caption);
        }

        // ✅ PROXY DOWNLOAD: Fetch file with browser headers to bypass 403/404
        const fileResponse = await axios.get(audioUrl, {
            responseType: 'arraybuffer',
            timeout: 60000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': 'https://www.youtube.com/',
                'Accept': '*/*'
            }
        });

        // Send audio as buffer instead of URL
        await conn.sendMessage(from, {
            audio: fileResponse.data,
            mimetype: 'audio/mp4',
            ptt: false
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (error) {
        console.error("YTPlay Error:", error.response?.status || error.message);
        reply(`❌ Error: ${error.response?.data?.message || error.message}`);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
    }
});
