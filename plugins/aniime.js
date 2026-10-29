//---------------------------------------------------------------------------
//           KAMRAN-MD - KISS POST API (ONLY GIF & VIDEO)
//---------------------------------------------------------------------------

import { fileURLToPath } from 'url';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "kiss",
    alias: ["kissing", "kiss2"],
    desc: "Fetch random kiss video or gif via POST request",
    category: "downloader",
    react: "💋",
    filename: __filename
},
async (conn, mek, m, { from, reply, react }) => {
    try {
        await react("🔥");
        await conn.sendPresenceUpdate('composing', from);

        // POST request method
        const response = await fetch('https://prexzyapis.com/nsfw/kiss', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
        });

        const textResponse = await response.text();
        let mediaUrl = "";

        try {
            const data = JSON.parse(textResponse);
            mediaUrl = data?.url || data?.result || data?.data;
        } catch (err) {
            mediaUrl = textResponse.startsWith('http') ? textResponse : 'https://prexzyapis.com/nsfw/kiss';
        }

        if (!mediaUrl || typeof mediaUrl !== 'string' || !mediaUrl.startsWith('http')) {
            await react("❌");
            return reply(`❌ Failed to fetch kiss media from API!`);
        }

        let finalCaption = `❖ ── ✦ *KISS MEDIA* ✦ ── ❖\n\n`;
        finalCaption += `> 💫 _Powered by Kamran-Md_`;

        // Sirf video ya GIF format mein bhejne ke liye
        await conn.sendMessage(from, {
            video: { url: mediaUrl },
            caption: finalCaption,
            mimetype: "video/mp4",
            gifPlayback: true, // Yeh ensure karega ke media GIF/Video ki tarah play ho
            contextInfo: { mentionedJid: [mek.sender] }
        }, { quoted: mek });

        await react("✅");

    } catch (e) {
        console.error("Kiss POST Error:", e.message);
        await react("❌");
        reply(`❌ Error: ${e.message}`);
    }
});
