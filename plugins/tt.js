// DR KAMRAN 

import { fileURLToPath } from 'url';
import axios from 'axios';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);

const headers = {
    'user-agent': 'Mozilla/5.0'
};

async function sendCustomMessage(client, jid, content, options = {}) {
    const isMedia = content.video || content.image;

    const customContent = {
        ...content,
        mentions: content.mentions || client.parseMention?.(content?.text || content?.caption || '') || []
    };

    if (isMedia) {
        customContent.streamingSidecar = Buffer.from('Omw4hLediba3yg==', 'base64');
        customContent.annotations = [
            {
                polygonVertices: [
                    { x: 0, y: 0 },
                    { x: 1000, y: 0 },
                    { x: 1000, y: 1000 },
                    { x: 0, y: 1000 }
                ],
                shouldSkipConfirmation: true,
                embeddedContent: {
                    embeddedMusic: {
                        musicContentMediaId: "1409620227516822",
                        songId: "244215252974958",
                        author: global.author || "DR KAMRAN",
                        title: global.namebot || "KAMRAN-MD",
                        artistAttribution: "https://whatsapp.com/channel/0029VbAhxYY90x2vgwhXJV3O/6707",
                        countryBlocklist: "",
                        isExplicit: false
                    }
                },
                embeddedAction: true
            }
        ];
    }

    return await client.sendMessage(jid, customContent, options);
}

cmd({
    pattern: "ttsearch",
    alias: ["tiktoksearch"],
    desc: "Search videos from TikTok",
    category: "search",
    react: "🎬",
    filename: __filename
},
async (conn, mek, m, { from, quoted, body, isCmd, command, args, q, reply }) => {
    try {
        if (!q) {
            return reply(
                `╔════════════════════════╗\n` +
                `║   🎬 KAMRAN-MD TIKTOK SEARCH 🎬   \n` +
                `╚════════════════════════╝\n\n` +
                `❌ *Kripya TikTok search ke liye query dein!*\n\n` +
                `> 📌 *Example:* \`.ttsearch Makima edit\`\n` +
                `> ⚡ *Version:* \`12.00\``
            );
        }

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        const { data } = await axios.get('https://api.nexray.eu.cc/search/tiktok', {
            params: {
                q: q
            },
            headers
        });

        if (!data?.status || !Array.isArray(data.result) || data.result.length === 0) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ *Video TikTok nahi mili!*");
        }

        const result = data.result.find(v => v?.data);

        if (!result) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ *Media video nahi mili!*");
        }

        const caption = `
╔════════════════════════╗
║   🎬 TIKTOK SEARCH RESULT   
╚════════════════════════╝

❀ *Judul:* ${result.title || 'TikTok Video'}
❀ *Uploader:* ${result.author?.nickname || 'Unknown'}

> ⚡ *Version:* \`10.00\`
> 👑 *Powered by KAMRAN MD*`.trim();

        await sendCustomMessage(
            conn,
            from,
            {
                video: {
                    url: result.data
                },
                mimetype: 'video/mp4',
                caption: caption
            },
            {
                quoted: mek
            }
        );

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        return reply("❌ *Kuch galat ho gaya, kripya thodi der baad koshish karein!*");
    }
});
