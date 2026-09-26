import { fileURLToPath } from 'url';
import axios from 'axios';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);

// ============ CAPCUT DOWNLOADER ============
cmd({
    pattern: "capcut",
    alias: ["cc", "capcutdl"],
    desc: "Download CapCut video",
    category: "downloader",
    react: "🎬",
    filename: __filename
}, async (conn, mek, m, { from, args, reply }) => {
    try {
        if (!args.length) {
            return reply("❌ Please provide a CapCut link. Example: .capcut https://www.capcut.com/tv2/ZS42qbGY9/");
        }

        const url = args[0];
        const headers = {
            'Content-Type': 'application/json',
            'Origin': 'https://snapvideotools.com',
            'Referer': 'https://snapvideotools.com/id/capcut-downloader',
            'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36',
            'Sec-Ch-Ua': '"Chromium";v="139", "Not;A=Brand";v="99"',
            'Sec-Ch-Ua-Mobile': '?1',
            'Sec-Ch-Ua-Platform': '"Android"',
            'X-Requested-With': 'XMLHttpRequest'
        };

        const response = await axios.post('https://snapvideotools.com/id/api/snap', { text: url }, { headers });
        const result = response.data;

        if (!result) {
            return reply("❌ Failed to fetch video.");
        }

        const videoUrl = result.url || result.data?.url || result.download_url;

        if (!videoUrl) {
            return reply("❌ Could not find downloadable video link.");
        }

        await conn.sendMessage(from, {
            video: { url: videoUrl },
            caption: `*CapCut Downloader*\n\n> *𝐊𝐀𝐌𝐑𝐀𝐍 𝐌𝐃*`
        }, { quoted: mek });

    } catch (e) {
        return reply(`*An error occurred while processing your request.*\n\n_Error:_ ${e.message}`);
    }
});

// ============ SOUNDCLOUD DOWNLOADER ============
cmd({
    pattern: "soundcloud",
    alias: ["sc", "scdl"],
    desc: "Download SoundCloud audio",
    category: "downloader",
    react: "🎵",
    filename: __filename
}, async (conn, mek, m, { from, args, reply }) => {
    try {
        if (!args.length) {
            return reply("❌ Please provide a SoundCloud link. Example: .soundcloud https://on.soundcloud.com/xxxx");
        }

        const url = args[0];
        const headers = {
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36',
            'Origin': 'https://www.dltracks.com',
            'Referer': 'https://www.dltracks.com/'
        };

        const response = await axios.post('https://www.dltracks.com/api/soundcloud', { url }, { headers });
        const result = response.data;

        if (!result) {
            return reply("❌ Failed to fetch audio.");
        }

        const audioUrl = result.url || result.download_url || result.data?.url;

        if (!audioUrl) {
            return reply("❌ Could not find downloadable audio link.");
        }

        await conn.sendMessage(from, {
            audio: { url: audioUrl },
            mimetype: 'audio/mp4',
            caption: `> *𝐊𝐀𝐌𝐑𝐀𝐍 𝐌𝐃*`
        }, { quoted: mek });

    } catch (e) {
        return reply(`*An error occurred while processing your request.*\n\n_Error:_ ${e.message}`);
    }
});
