// ꜰᴀᴛɪᴍᴀ-ᴍᴅ

import { fileURLToPath } from 'url';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "delete",
    alias: ["del", "dlt"],
    desc: "Delete a quoted message with FATIMA-MD style",
    category: "group",
    react: "🗑️",
    filename: __filename
}, async (conn, mek, m, {
    from,
    isCreator,
    isGroup,
    reply
}) => {
    try {
        if (!isGroup) return reply(
            `╔════════════════════════╗\n` +
            `║   🗑️ FATIMA-MD DELETE  🗑️   \n` +
            `╚════════════════════════╝\n\n` +
            `❌ *Yeh command sirf groups mein use ho sakti hai!*\n\n` +
            `> ⚡ *Version:* \`12.00\``
        );
        
        if (!isCreator) return reply(
            `╔════════════════════════╗\n` +
            `║   👑 FATIMA-MD OWNER   👑   \n` +
            `╚════════════════════════╝\n\n` +
            `❌ *Sirf bot owner yeh command use kar sakta hai!*\n\n` +
            `> ⚡ *Version:* \`12.00\``
        );
        
        if (!m.quoted) return reply(
            `╔════════════════════════╗\n` +
            `║   🗑️ FATIMA-MD DELETE  🗑️   \n` +
            `╚════════════════════════╝\n\n` +
            `❌ *Kripya delete karne ke liye kisi message par reply karein!*\n\n` +
            `> ⚡ *Version:* \`12.00\``
        );
        
        const key = {
            remoteJid: m.chat,
            fromMe: false,
            id: m.quoted.id,
            participant: m.quoted.sender
        };
        
        await conn.sendMessage(m.chat, { delete: key });
        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });
        
    } catch (err) {
        console.error("Delete Command Error:", err);
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
        await reply(`❌ *Failed to delete message:* \`\`\`${err.message}\`\`\``);
    }
});
