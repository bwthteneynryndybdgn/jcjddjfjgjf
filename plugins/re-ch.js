import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "rch",
    alias: ["reactchannel", "channelreact"],
    desc: "React to a WhatsApp channel message using API",
    category: "tools",
    react: "👍",
    filename: __filename
}, async (conn, mek, m, { from, text, usedPrefix, command, reply }) => {
    try {
        const query = text ? text.trim() : "";

        if (!query) {
            return reply(
                `⚠️ *Format salah!*\n\n` +
                `*Contoh:* \n` +
                `• \`${usedPrefix + command} https://whatsapp.com/channel/.../153 👍\``
            );
        }

        const args = query.split(/\s+/);
        const url = args[0];
        const reaction = args[1] || '👍';

        if (!url.includes('whatsapp.com/channel/')) {
            return reply(`❌ URL harus berupa link pesan WhatsApp Channel yang valid!`);
        }

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        const api = `https://apiii-xrina.vercel.app/tools/rch?url=${encodeURIComponent(url)}&reaction=${encodeURIComponent(reaction)}&apikey=Rin-rch`;

        const res = await fetch(api);
        const responseText = await res.text();

        let json;
        try {
            json = JSON.parse(responseText);
        } catch (err) {
            console.error('[RCH JSON PARSE ERROR]', responseText);
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply(`❌ Server API sedang bermasalah atau mengirim response non-JSON (HTML Error).`);
        }

        if (!json.status) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply(`❌ Gagal mengirim reaction: ${json.message || 'Unknown error'}`);
        }

        const data = json.data || {};

        let successText = `✅ *Reaction Berhasil Dikirim!*\n\n` +
            `💬 *Reaction:* ${data.reaction?.join(' ') || reaction}\n` +
            `📢 *Platform:* WhatsApp Channel\n` +
            `📝 *Status:* Berhasil mengirim react ke pesan channel\n\n` +
            `✨ *Powered by KAMRAN-MD*`;

        await reply(successText);
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (error) {
        console.error('[RCH ERROR]', error);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        reply(`❌ Gagal mengirim reaction:\n${error.message || error}`);
    }
});
