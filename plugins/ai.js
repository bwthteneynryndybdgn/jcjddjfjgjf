import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "gemini",
    alias: ["ai", "ask"],
    desc: "Ask anything to Gemini AI via custom API",
    category: "ai",
    react: "🤖",
    filename: __filename
}, async (conn, mek, m, { from, text, usedPrefix, command, reply }) => {
    try {
        const query = text ? text.trim() : "";

        if (!query) {
            return reply(`⚠️ *Format salah!*\n\n*Contoh:* \n• \`${usedPrefix + command} Halo, apa kabar?\``);
        }

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        const apiUrl = `https://kiraxmd-api.vercel.app/api/gemini?q=${encodeURIComponent(query)}`;
        const res = await axios.get(apiUrl, { timeout: 30000 });
        const data = res.data;

        // API ke response structure ke mutabiq text extract karein
        const resultText = data?.result || data?.response || data?.message || JSON.stringify(data);

        await reply(resultText);
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (error) {
        console.error('[GEMINI AI ERROR]', error);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        reply(`❌ Gagal mendapatkan respons dari AI:\n${error.message || error}`);
    }
});
