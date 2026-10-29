//---------------------------------------------------------------------------
//           KAMRAN-MD - COMPLETE MULTI-COMMAND NSFW PLUGIN (FIXED)
//---------------------------------------------------------------------------

import { fileURLToPath } from 'url';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);

const fetchAndSendMedia = async (conn, mek, m, from, reply, react, endpoint, title) => {
    try {
        await react("🔥");
        await conn.sendPresenceUpdate('composing', from);

        const targetUrl = `https://prexzyapis.com/nsfw/${endpoint}`;
        const response = await fetch(targetUrl);
        const textResponse = await response.text();

        let mediaUrl = "";

        try {
            const jsonData = JSON.parse(textResponse);
            mediaUrl = jsonData?.url || jsonData?.result || jsonData?.data;
        } catch (err) {
            mediaUrl = textResponse.startsWith('http') ? textResponse : targetUrl;
        }

        if (!mediaUrl || typeof mediaUrl !== 'string' || !mediaUrl.startsWith('http')) {
            await react("❌");
            return reply(`❌ Failed to fetch ${title} media from API!`);
        }

        const isVideo = mediaUrl.endsWith('.mp4') || mediaUrl.includes('video') || endpoint === 'hentai-sfm';

        let finalCaption = `❖ ── ✦ *${title.toUpperCase()}* ✦ ── ❖\n\n`;
        finalCaption += `> 💫 _Powered by Kamran-Md_`;

        if (isVideo) {
            // Video direct playable message ke taur par bhejna
            await conn.sendMessage(from, {
                video: { url: mediaUrl },
                caption: finalCaption,
                mimetype: "video/mp4",
                contextInfo: { mentionedJid: [mek.sender] }
            }, { quoted: mek });
        } else {
            // Image direct photo ke taur par bhejna
            await conn.sendMessage(from, {
                image: { url: mediaUrl },
                caption: finalCaption,
                contextInfo: { mentionedJid: [mek.sender] }
            }, { quoted: mek });
        }

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

// 17. Hentai-Sfm Command (Supports both .hentaisfm and .hentai-sfm)
cmd({ pattern: "hentaisfm", alias: ["hentai-sfm"], desc: "Fetch hentai-sfm media", category: "downloader", filename: __filename }, 
async (conn, mek, m, { from, reply, react }) => { await fetchAndSendMedia(conn, mek, m, from, reply, react, "hentai-sfm", "Hentai Sfm"); });

// 18. Kiss Command (Supports both .kiss and .kiss2)
cmd({ pattern: "kiss3", alias: ["kiss2"], desc: "Fetch kiss media", category: "downloader", filename: __filename }, 
async (conn, mek, m, { from, reply, react }) => { await fetchAndSendMedia(conn, mek, m, from, reply, react, "kiss", "Kiss"); });

// 19. Pegged Command
cmd({ pattern: "pegged", desc: "Fetch pegged media", category: "downloader", filename: __filename }, 
async (conn, mek, m, { from, reply, react }) => { await fetchAndSendMedia(conn, mek, m, from, reply, react, "pegged", "Pegged"); });

// 20. Tattoo Command
cmd({ pattern: "tattoo", desc: "Fetch tattoo media", category: "downloader", filename: __filename }, 
async (conn, mek, m, { from, reply, react }) => { await fetchAndSendMedia(conn, mek, m, from, reply, react, "tattoo", "Tattoo"); });
