import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);

// ==================== AUTO BODY TEMP OTPS LISTENER ====================
cmd({
    on: "body"
}, async (conn, mek, m, { from, body }) => {
    try {
        if (!body) return;
        const rawText = body.trim().toLowerCase();
        
        const triggers = ['otps', 'tempotps', 'latestotps'];
        if (triggers.some(t => rawText === t || rawText.startsWith(t + ' '))) {
            await executeTempOtps(conn, mek, from);
        }
    } catch (error) {
        console.error("Auto-Body Temp OTPs Error:", error);
    }
});

// ==================== TEMP OTPS COMMAND (Prefix Version) ====================
cmd({
    pattern: "otps",
    alias: ["tempotps", "latestotps", "verificationcodes"],
    use: '.otps',
    desc: "Fetch recent temporary OTPs using Omegatech API",
    category: "tools",
    react: "🔐",
    filename: __filename
},
async (conn, mek, m, { from, reply }) => {
    try {
        await executeTempOtps(conn, mek, from, mek);
    } catch (e) {
        console.error("Error in otps command:", e);
        reply(`An error occurred: ${e.message}`);
    }
});

// ==================== CORE TEMP OTPS LOGIC ====================
async function executeTempOtps(conn, mek, from, quotedMek = mek) {
    try {
        await conn.sendMessage(from, { react: { text: "⏳", key: quotedMek.key } });

        const apiUrl = `https://api.omegatech.app/api/tools/Temp-number?action=otps`;
        const response = await axios.get(apiUrl, { timeout: 30000 });
        const resData = response.data;

        if (!resData || !resData.success || !resData.data || !resData.data.otps || resData.data.otps.length === 0) {
            await conn.sendMessage(from, { react: { text: "❌", key: quotedMek.key } });
            return await conn.sendMessage(from, { text: `❌ Temporary OTPs ko fetch karne mein nakami hui.` }, { quoted: quotedMek });
        }

        const totalAvailable = resData.data.total || 45908;
        const otpsList = resData.data.otps.slice(0, 10); // Displaying top 10 recent OTPs

        let msg = `> *KAMRAN-MD RECENT OTPS* 🔐\n\n`;
        msg += `🌐 *Total Records:* ${totalAvailable}\n\n`;

        otpsList.forEach((item, index) => {
            msg += `*${index + 1}. Service:* ${item.sender || 'Unknown'}\n`;
            msg += `🌍 *Country:* ${item.country || 'Unknown'} ${item.flag || ''}\n`;
            msg += `📞 *Number:* \`${item.number || ''}\`\n`;
            msg += `🔑 *OTP:* *${item.otp || 'N/A'}*\n`;
            msg += `⏰ *Time:* ${item.time || 'N/A'}\n\n`;
        });

        msg += `_Yahan upar latest incoming verification codes diye gaye hain!_`;

        await conn.sendMessage(from, { text: msg }, { quoted: quotedMek });
        await conn.sendMessage(from, { react: { text: "✅", key: quotedMek.key } });

    } catch (error) {
        console.error("Temp OTPs Fetch Error:", error);
        await conn.sendMessage(from, { react: { text: "❌", key: quotedMek.key } });
        await conn.sendMessage(from, { text: `❌ Error: ${error.message}` }, { quoted: quotedMek });
    }
}
