import { fileURLToPath } from 'url';
import axios from 'axios';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);
const XV_API = "https://jerrycoder.oggyapi.workers.dev";

const AXIOS_DEFAULTS = {
    timeout: 30000,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'application/json'
    }
};

async function tryRequest(fn, tries = 3) {
    let err;
    for (let i = 1; i <= tries; i++) {
        try {
            return await fn();
        } catch (e) {
            err = e;
            await new Promise(r => setTimeout(r, i * 1000));
        }
    }
    throw err;
}

async function react(sock, mek, emoji) {
    try {
        await sock.sendMessage(mek.key.remoteJid, {
            react: { text: emoji, key: mek.key }
        });
    } catch (e) {}
}

function xBox(data) {
    return `
‎*╔ஜ۩▒█ *ᴋᴀᴍʀᴀɴ ᴍᴅ* █▒۩ஜ╗*
*|* *_ᴋᴀᴍʀᴀɴ-ᴍᴅ xᴠɪᴅᴇᴏs_* 
*|┉┉┉┉◉◉◉┉┉┉┉┉┉┉━•⟢*
*|▸ 📌 ᴛɪᴛʟᴇ:* ${data.title || "N/A"}
*|▸ ⏱ ᴅᴜʀᴀᴛɪᴏɴ:* ${data.duration || "N/A"}
*|▸ 👁️ ᴠɪᴇᴡs:* ${data.views || "N/A"}
*|▸ 🥵 ᴏɴʟʏ:* 🔞.... 
*╰━━━━━━━━━━━━━━━━━━⊷*`;
}

// ✅ FIXED SEARCH FUNCTION
async function searchXvideos(query) {
    const apiUrl = `${XV_API}/search/xnxx?q=${encodeURIComponent(query)}`;
    console.log(`[SEARCH] Fetching: ${apiUrl}`);
    
    const res = await tryRequest(() => axios.get(apiUrl, AXIOS_DEFAULTS));
    const data = res.data;

    let results = [];
    
    // Primary fix: check 'results' key first based on your logs
    if (data.results && Array.isArray(data.results)) {
        results = data.results;
    } else if (Array.isArray(data)) {
        results = data;
    } else if (data.result && Array.isArray(data.result)) {
        results = data.result;
    }

    if (results.length > 0) {
        console.log(`[SEARCH] Found ${results.length} videos.`);
        return results;
    }
    
    throw new Error("No results found");
}

async function downloadXvideo(url) {
    const api = `${XV_API}/down/xnxx?url=${encodeURIComponent(url)}`;
    console.log(`[DOWNLOAD] Fetching: ${api}`);
    
    const res = await tryRequest(() => axios.get(api, AXIOS_DEFAULTS));
    
    if (res.data.status === "success") {
        const dlLink = res.data.downloads?.low_quality || 
                       res.data.downloads?.high_quality || 
                       res.data.downloads?.direct_download;
                       
        if (dlLink) {
            return {
                url: dlLink,
                title: res.data.o_title || "Video",
                thumb: res.data.thumbnail
            };
        }
    }
    throw new Error("Download link extraction failed");
}

cmd({
    pattern: "xxxvideo",
    alias: ["xxx", "porn", "sex", "sexyvideos", "pornhub", "xvideos", "sexy"],
    desc: "Search or download Xvideos/XNXX",
    category: "adult",
    react: "🔞",
    filename: __filename
}, async (sock, mek, m, { reply }) => {

    try {
        const text = m.message?.conversation || m.message?.extendedTextMessage?.text || "";
        const query = text.split(" ").slice(1).join(" ").trim();

        if (!query)
            return reply("⚠️ *Usage:*\n.xvideo <name or link>");

        await react(sock, mek, "🔍");

        let videoData;
        let videoUrl;

        if (query.startsWith("http")) {
            videoUrl = query;
            videoData = { 
                title: "Direct Link Video", 
                duration: "Unknown", 
                views: "N/A", 
                thumbnail: "" 
            };
        } else {
            try {
                const results = await searchXvideos(query);
                videoData = results[0];
                videoUrl = videoData.url;
                
                // Normalize field names
                if (!videoData.title && videoData.o_title) videoData.title = videoData.o_title;
                if (!videoData.thumbnail && videoData.thumb) videoData.thumbnail = videoData.thumb;

            } catch (searchErr) {
                await react(sock, mek, "❌");
                return reply(`❌ Search Error: ${searchErr.message}\nTry a different keyword.`);
            }
        }

        await sock.sendMessage(m.chat, {
            image: { url: videoData.thumbnail || videoData.thumb || "https://files.catbox.moe/16i1l7.jpg" },
            caption: xBox(videoData)
        }, { quoted: mek });

        await react(sock, mek, "⏳");

        let file;
        try {
            file = await downloadXvideo(videoUrl);
        } catch (e) {
            await react(sock, mek, "❌");
            return reply(`❌ Download Error: ${e.message}`);
        }

        await sock.sendMessage(m.chat, {
            video: { url: file.url },
            mimetype: "video/mp4",
            fileName: `${file.title || videoData.title}.mp4`,
            caption: `
‎*╔ஜ۩▒█ *ᴋᴀᴍʀᴀɴ ᴍᴅ* █▒۩ஜ╗*
‎*| 𝙿𝙾𝚆𝙴𝚁𝙴𝙳 𝙱𝚈 *ᴋᴀᴍʀᴀɴ-ᴍᴅ* 
‎*╰━━━━━━━━━━━━━━━━━━⊷*`
        }, { quoted: mek });

        await react(sock, mek, "✅");

    } catch (e) {
        console.error(e);
        await react(sock, mek, "❌");
        reply(`❌ System Error: ${e.message}`);
    }
});
