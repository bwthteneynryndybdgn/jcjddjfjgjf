import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);

// ==================== AUTO BODY TEMP NUMBER LISTENER ====================
cmd({
    on: "body"
}, async (conn, mek, m, { from, body }) => {
    try {
        if (!body) return;
        const rawText = body.trim().toLowerCase();
        
        const triggers = ['tempnum', 'tempnumber', 'freenumber'];
        if (triggers.some(t => rawText === t || rawText.startsWith(t + ' '))) {
            await executeTempNumbers(conn, mek, from);
        }
    } catch (error) {
        console.error("Auto-Body Temp Number Error:", error);
    }
});

// ==================== TEMP NUMBER COMMAND (Prefix Version) ====================
cmd({
    pattern: "tempnum",
    alias: ["tempnumber", "freenumber", "otpnumber"],
    use: '.tempnum',
    desc: "Fetch temporary phone numbers using Omegatech API",
    category: "tools",
    react: "📱",
    filename: __filename
},
async (conn, mek, m, { from, reply }) => {
    try {
        await executeTempNumbers(conn, mek, from, mek);
    } catch (e) {
        console.error("Error in tempnum command:", e);
        reply(`An error occurred: ${e.message}`);
    }
});

// ==================== CORE TEMP NUMBER LOGIC ====================
async function executeTempNumbers(conn, mek, from, quotedMek = mek) {
    try {
        await conn.sendMessage(from, { react: { text: "⏳", key: quotedMek.key } });

        const apiUrl = `https://api.omegatech.app/api/tools/Temp-number?action=numbers&limit=10`;
        const response = await axios.get(apiUrl, { timeout: 30000 });
        const resData = response.data;

        if (!resData || !resData.success || !resData.data || !resData.data.numbers || resData.data.numbers.length === 0) {
            await conn.sendMessage(from, { react: { text: "❌", key: quotedMek.key } });
            return await conn.sendMessage(from, { text: `❌ Temporary numbers ko fetch karne mein nakami hui.` }, { quoted: quotedMek });
        }

        const totalAvailable = resData.data.total || 14000;[span_1](start_span)[span_1](end_span)
        const numbers = resData.data.numbers.slice(0, 10);

        let msg = `> *KAMRAN-MD TEMP NUMBERS* 📱\n\n`;
        msg += `🌐 *Total Available:* ${totalAvailable}\n\n`;

        numbers.forEach((item, index) => {
            msg += `*${index + 1}. Country:* ${item.country} ${item.flag || ''}\n`;
            msg += `📞 *Code:* +${item.countryCode}\n`;
            msg += `🔢 *Number:* \`${item.number}\`\n\n`;
        });

        msg += `_Yahan upar diye gaye numbers OTP verification ke liye istemal kiye ja sakte hain!_`;

        await conn.sendMessage(from, { text: msg }, { quoted: quotedMek });
        await conn.sendMessage(from, { react: { text: "✅", key: quotedMek.key } });

    } catch (error) {
        console.error("Temp Number Fetch Error:", error);
        await conn.sendMessage(from, { react: { text: "❌", key: quotedMek.key } });
        await conn.sendMessage(from, { text: `❌ Error: ${error.message}` }, { quoted: quotedMek });
    }
}
