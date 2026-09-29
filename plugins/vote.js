import { fileURLToPath } from 'url';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "vote",
    alias: ["autovote", "channelvote"],
    desc: "Beri vote reaksi otomatis ke postingan channel WhatsApp",
    category: "tools",
    filename: __filename
},
async (conn, mek, m, { from, args, q, reply, react, isCreator }) => {
    try {
        // Hanya Owner/Creator yang bisa menggunakan
        if (!isCreator) return reply("❌ Perintah ini hanya khusus untuk Owner Bot!");

        // Validasi input
        if (!q || args.length < 2) {
            return reply(
                `⚠️ *FORMAT SALAH!*\n\n` +
                `📌 *Cara Penggunaan:*\n` +
                `.vote <Link Postingan Channel> <Pilihan Option>\n\n` +
                `💡 *Contoh:*\n` +
                `• .vote https://whatsapp.com/channel/0029Va.../123 1\n` +
                `• .vote https://whatsapp.com/channel/0029Va.../123 2`
            );
        }

        const channelLink = args[0];
        const option = args[1];

        // Ekstrak Channel ID / Code dan Message ID dari Link
        // Format Link Channel: https://whatsapp.com/channel/CODE/MESSAGE_ID
        const linkRegex = /whatsapp\.com\/channel\/([A-Za-z0-9]+)\/(\d+)/;
        const match = channelLink.match(linkRegex);

        if (!match) {
            return reply("❌ Link channel tidak valid! Pastikan menyalin link pesan dari dalam channel.");
        }

        const channelJid = `${match[1]}@newsletter`;
        const serverMessageId = match[2];

        // Menentukan emoji reaksi berdasarkan opsi 1 atau 2 (Bisa diganti sesuai kebutuhan)
        let reactionEmoji = "";
        if (option === "1") {
            reactionEmoji = "👍"; // Atau emoji angka1 1️⃣
        } else if (option === "2") {
            reactionEmoji = "❤️"; // Atau emoji angka2 2️⃣
        } else {
            return reply("❌ Opsi tidak valid! Pilih angka *1* atau *2*.");
        }

        await react("⏳");

        // Mengirimkan reaksi langsung ke pesan channel target
        await conn.sendMessage(channelJid, {
            react: {
                text: reactionEmoji,
                key: {
                    remoteJid: channelJid,
                    id: serverMessageId,
                    fromMe: false
                }
            }
        });

        await react("✅");
        return reply(
            `✅ *VOTE BERHASIL DIKIRIM!*\n\n` +
            `📢 *Channel JID:* \`${channelJid}\`\n` +
            `🆔 *Message ID:* \`${serverMessageId}\`\n` +
            `🎯 *Opsi Terpilih:* ${option} (${reactionEmoji})`
        );

    } catch (error) {
        console.error("Channel Vote Error:", error);
        await react("❌");
        return reply(`❌ Gagal mengirim vote ke channel! Terjadi kesalahan: ${error.message}`);
    }
});
