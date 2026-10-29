//---------------------------------------------------------------------------
//           KAMRAN-MD - MULTI-COMMAND FETCH NSFW PLUGIN
//---------------------------------------------------------------------------

import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);

const fetchAndSendMedia = async (conn, mek, m, from, reply, react, endpoint, title) => {
    try {
        await react("🔥");
        await conn.sendPresenceUpdate('composing', from);

        // Aapke bataye hue fetch method ki tarah API call
        const response = await fetch(`https://prexzyapis.com/nsfw/${endpoint}`);
        const data = await response.json();

        // Data se media URL nikalna
        const mediaUrl = data?.url || data?.result || data?.data;

        if (!mediaUrl || typeof mediaUrl !== 'string' || !mediaUrl.startsWith('http')) {
            await react("❌");
            return reply(`❌ Failed to fetch ${title} media from API!`);
        }

        const isVideo = mediaUrl.endsWith('.mp4') || mediaUrl.includes('video') || endpoint === 'hentai-sfm';
        const mimetype = isVideo ? 'video/mp4' : 'image/jpeg';
        const fileName = `${endpoint}_${Date.now()}.${isVideo ? 'mp4' : 'jpg'}`;

        let finalCaption = `❖ ── ✦ *${title.toUpperCase()}* ✦ ── ❖\n\n`;
        finalCaption += `> 💫 _Powered by Kamran-Md_`;

        let documentPayload = {
            document: { url: mediaUrl },
            mimetype: mimetype,
            fileName: fileName,
            caption: finalCaption,
            contextInfo: { mentionedJid: [mek.sender] }
        };

        await conn.sendMessage(from, documentPayload, { quoted: mek });
        await react("✅");

    } catch (e) {
        console.error(`${title} Error:`, e.message);
        await react("❌");
        reply(`❌ Error: ${e.message}`);
    }
};

// 1. Sixtynine Command
cmd({ pattern: "sixtynine", desc: "Fetch sixtynine media", category: "downloader", filename: __filename }, 
async (conn, mek, m, { from, reply, react }) => { await fetchAndSendMedia(conn, mek, m, from, reply, react, "sixtynine", "Sixtynine"); });

// 2. Anal Command
cmd({ pattern: "anal", desc: "Fetch anal media", category: "downloader", filename: __filename }, 
async (conn, mek, m, { from, reply, react }) => { await fetchAndSendMedia(conn, mek, m, from, reply, react, "anal", "Anal"); });

// 3. Ass Command
cmd({ pattern: "ass", desc: "Fetch ass media", category: "downloader", filename: __filename }, 
async (conn, mek, m, { from, reply, react }) => { await fetchAndSendMedia(conn, mek, m, from, reply, react, "ass", "Ass"); });

// 4. Bdsm Command
cmd({ pattern: "bdsm", desc: "Fetch bdsm media", category: "downloader", filename: __filename }, 
async (conn, mek, m, { from, reply, react }) => { await fetchAndSendMedia(conn, mek, m, from, reply, react, "bdsm", "Bdsm"); });

// 5. Black Command
cmd({ pattern: "black", desc: "Fetch black media", category: "downloader", filename: __filename }, 
async (conn, mek, m, { from, reply, react }) => { await fetchAndSendMedia(conn, mek, m, from, reply, react, "black", "Black"); });

// 6. Bottomless Command
cmd({ pattern: "bottomless", desc: "Fetch bottomless media", category: "downloader", filename: __filename }, 
async (conn, mek, m, { from, reply, react }) => { await fetchAndSendMedia(conn, mek, m, from, reply, react, "bottomless", "Bottomless"); });

// 7. Collared Command
cmd({ pattern: "collared", desc: "Fetch collared media", category: "downloader", filename: __filename }, 
async (conn, mek, m, { from, reply, react }) => { await fetchAndSendMedia(conn, mek, m, from, reply, react, "collared", "Collared"); });

// 8. Cum Command
cmd({ pattern: "cum", desc: "Fetch cum media", category: "downloader", filename: __filename }, 
async (conn, mek, m, { from, reply, react }) => { await fetchAndSendMedia(conn, mek, m, from, reply, react, "cum", "Cum"); });

// 9. Dick Command
cmd({ pattern: "dick", desc: "Fetch dick media", category: "downloader", filename: __filename }, 
async (conn, mek, m, { from, reply, react }) => { await fetchAndSendMedia(conn, mek, m, from, reply, react, "dick", "Dick"); });

// 10. Cumsluts Command
cmd({ pattern: "cumsluts", desc: "Fetch cumsluts media", category: "downloader", filename: __filename }, 
async (conn, mek, m, { from, reply, react }) => { await fetchAndSendMedia(conn, mek, m, from, reply, react, "cumsluts", "Cumsluts"); });

// 11. Dom Command
cmd({ pattern: "dom", desc: "Fetch dom media", category: "downloader", filename: __filename }, 
async (conn, mek, m, { from, reply, react }) => { await fetchAndSendMedia(conn, mek, m, from, reply, react, "dom", "Dom"); });

// 12. Easter Command
cmd({ pattern: "easter", desc: "Fetch easter media", category: "downloader", filename: __filename }, 
async (conn, mek, m, { from, reply, react }) => { await fetchAndSendMedia(conn, mek, m, from, reply, react, "easter", "Easter"); });

// 13. Feet Command
cmd({ pattern: "feet", desc: "Fetch feet media", category: "downloader", filename: __filename }, 
async (conn, mek, m, { from, reply, react }) => { await fetchAndSendMedia(conn, mek, m, from, reply, react, "feet", "Feet"); });

// 14. Finger Command
cmd({ pattern: "finger", desc: "Fetch finger media", category: "downloader", filename: __filename }, 
async (conn, mek, m, { from, reply, react }) => { await fetchAndSendMedia(conn, mek, m, from, reply, react, "finger", "Finger"); });

// 15. Extreme Command
cmd({ pattern: "extreme", desc: "Fetch extreme media", category: "downloader", filename: __filename }, 
async (conn, mek, m, { from, reply, react }) => { await fetchAndSendMedia(conn, mek, m, from, reply, react, "extreme", "Extreme"); });

// 16. Group Command
cmd({ pattern: "group", desc: "Fetch group media", category: "downloader", filename: __filename }, 
async (conn, mek, m, { from, reply, react }) => { await fetchAndSendMedia(conn, mek, m, from, reply, react, "group", "Group"); });

// 17. Hentai-Sfm Command
cmd({ pattern: "hentaisfm", alias: ["hentai-sfm"], desc: "Fetch hentai-sfm media", category: "downloader", filename: __filename }, 
async (conn, mek, m, { from, reply, react }) => { await fetchAndSendMedia(conn, mek, m, from, reply, react, "hentai-sfm", "Hentai Sfm"); });

// 18. Kiss Command
cmd({ pattern: "kiss2", desc: "Fetch kiss media", category: "downloader", filename: __filename }, 
async (conn, mek, m, { from, reply, react }) => { await fetchAndSendMedia(conn, mek, m, from, reply, react, "kiss", "Kiss"); });

// 19. Pegged Command
cmd({ pattern: "pegged", desc: "Fetch pegged media", category: "downloader", filename: __filename }, 
async (conn, mek, m, { from, reply, react }) => { await fetchAndSendMedia(conn, mek, m, from, reply, react, "pegged", "Pegged"); });

// 20. Tattoo Command
cmd({ pattern: "tattoo", desc: "Fetch tattoo media", category: "downloader", filename: __filename }, 
async (conn, mek, m, { from, reply, react }) => { await fetchAndSendMedia(conn, mek, m, from, reply, react, "tattoo", "Tattoo"); });
