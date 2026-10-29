//---------------------------------------------------------------------------
//           KAMRAN-MD - KISS COMMAND PLUGIN
//---------------------------------------------------------------------------

import { fileURLToPath } from 'url';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "kiss",
    alias: ["kissing", "kiss2"],
    desc: "Fetch random kiss media (image/video/gif)",
    category: "downloader",
    react: "💋",
    filename: __filename
},
async (conn, mek, m, { from, reply, react }) => {
    try {
        await react("🔥");
        await conn.sendPresenceUpdate('composing', from);

        const targetUrl = `https://prexzyapis.com/nsfw/kiss`;
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
            return reply(`❌ Failed to fetch kiss media from API!`);
        }

        const isVideoOrGif = mediaUrl.endsWith('.mp4') || mediaUrl.endsWith('.gif') || mediaUrl.includes('.mp4') || mediaUrl.includes('.gif') || mediaUrl.includes('video');

        let finalCaption = `❖ ── ✦ *KISS MEDIA* ✦ ── ❖\n\n`;
        finalCaption += `> 💫 _Powered by Kamran-Md_`;

        if (isVideoOrGif) {
            await conn.sendMessage(from, {
                video: { url: mediaUrl },
                caption: finalCaption,
                mimetype: "video/mp4",
                gifPlayback: mediaUrl.endsWith('.gif') || mediaUrl.includes('.gif'),
                contextInfo: { mentionedJid: [mek.sender] }
            }, { quoted: mek });
        } else {
            await conn.sendMessage(from, {
                image: { url: mediaUrl },
                caption: finalCaption,
                contextInfo: { mentionedJid: [mek.sender] }
            }, { quoted: mek });
        }

        await react("✅");

    } catch (e) {
        console.error("Kiss Command Error:", e.message);
        await react("❌");
        reply(`❌ Error: ${e.message}`);
    }
});
