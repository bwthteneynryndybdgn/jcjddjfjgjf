import { fileURLToPath } from 'url';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "qr",
    alias: ["qrcode"],
    desc: "Generate QR code from text",
    category: "tools",
    react: "📲",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return reply("❌ Please provide text or URL to generate QR code!");

        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(q)}`;

        await conn.sendMessage(from, { 
            image: { url: qrUrl }, 
            caption: `📱 *QR Code Generated*\n\n> Powered by KAMRAN MD` 
        }, { quoted: mek });
    } catch (e) {
        console.error(e);
        reply("❌ Failed to generate QR code.");
    }
});
