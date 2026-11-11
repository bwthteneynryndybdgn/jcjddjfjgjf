import { fileURLToPath } from 'url';
import axios from 'axios';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);

// Updated API Base URL based on your screenshot
const XV_API = "https://jerrycoder.oggyapi.workers.dev";

const AXIOS_DEFAULTS = {
    timeout: 30000,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
    }
};

// 🔁 Retry helper
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

// ❤️ React helper
async function react(sock, mek, emoji) {
    try {
        await sock.sendMessage(mek.key.remoteJid, {
            react: { text: emoji, key: mek.key }
        });
    } catch (e) {} // Ignore reaction errors
}

// 📦 Stylish info box
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

// 🔍 Search API (Updated for JerryCoder)
async function searchXvideos(query) {
    // Endpoint: /search/xnxx?q=...
    const api = `${XV_API}/search/xnxx?q=${encodeURIComponent(query)}`;
    
    const res = await tryRequest(() => axios.get(api, AXIOS_DEFAULTS));
    
    // The API returns an array of objects directly
    if (Array.isArray(res.data) && res.data.length > 0) {
        return res.data; 
    }
    throw new Error("No results found");
}

// 🎬 Download API (Updated for JerryCoder)
async function downloadXvideo(url) {
    // Endpoint: /down/xnxx?url=...
    const api = `${XV_API}/down/xnxx?url=${encodeURIComponent(url)}`;
    
    const res = await tryRequest(() => axios.get(api, AXIOS_DEFAULTS));
    
    // Check for success status and extract low_quality link
    if (res.data.status === "success" && res.data.downloads?.low_quality) {
        return {
            url: res.data.downloads.low_quality,
            title: res.data.o_title || "Video",
            thumb: res.data.thumbnail
        };
    }
    throw new Error("Download link not found");
}

// ===============================
// 🔞 COMMAND: .xvideo <query|link>
// ===============================
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

        // 🔗 Direct link handling
        if (query.startsWith("http")) {
            videoUrl = query;
            // If it's a direct link, we might need to fetch details first or just use placeholders
            // For this logic, we assume the user wants to download immediately.
            // We will fetch details inside the download step or use generic ones.
            videoData = { title: "Direct Video", duration: "Unknown", views: "N/A", thumb: "" };
        } 
        // 🔎 Search handling
        else {
            const results = await searchXvideos(query);
            videoData = results[0]; // Take the first result
            
            // Map API fields to our standard fields if necessary
            // API returns: title, duration, views, thumbnail, url
            videoUrl = videoData.url;
        }

        // 📦 Send Info Box
        await sock.sendMessage(m.chat, {
            image: { url: videoData.thumbnail || videoData.thumb || "https://files.catbox.moe/16i1l7.jpg" },
            caption: xBox(videoData)
        }, { quoted: mek });

        await react(sock, mek, "⏳");

        // 🎬 Download Logic
        let file;
        try {
            file = await downloadXvideo(videoUrl);
        } catch (e) {
            // Fallback if download fails (sometimes APIs are strict about URLs)
            console.log("Primary download failed, trying fallback...");
            throw e; 
        }

        // 📤 Send Video
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
        reply(`❌ Error: ${e.message || "Download failed!"}`);
    }
});
