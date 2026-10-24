//---------------------------------------------------------------------------
//           KAMRAN-MD - UPTIME PLUGIN
//---------------------------------------------------------------------------

import { fileURLToPath } from 'url';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);

// Helper function for Stylist Badi ABC Text
const toStylistUpper = (text) => {
    if (!text || typeof text !== 'string') return '';
    const uppercaseMap = {
        'a': 'ᴀ', 'b': 'ʙ', 'c': 'ᴄ', 'd': 'ᴅ', 'e': 'ᴇ', 'f': 'ғ', 'g': 'ɢ', 'h': 'ʜ', 'i': 'ɪ',
        'j': 'ᴊ', 'k': 'ᴋ', 'l': 'ʟ', 'm': 'ᴍ', 'n': 'ɴ', 'o': 'ᴏ', 'p': 'ᴘ', 'q': 'ǫ', 'r': 'ʀ',
        's': 's', 't': 'ᴛ', 'u': 'ᴜ', 'v': 'ᴠ', 'w': 'ᴡ', 'x': 'x', 'y': 'ʏ', 'z': 'ᴢ',
        'A': 'ᴀ', 'B': 'ʙ', 'C': 'ᴄ', 'D': 'ᴅ', 'E': 'ᴇ', 'F': 'ғ', 'G': 'ɢ', 'H': 'ʜ', 'I': 'ɪ',
        'J': 'ᴊ', 'K': 'ᴋ', 'L': 'ʟ', 'M': 'ᴍ', 'N': 'ɴ', 'O': 'ᴏ', 'P': 'ᴘ', 'Q': 'ǫ', 'R': 'ʀ',
        'S': 's', 'T': 'ᴛ', 'U': 'ᴜ', 'V': 'ᴠ', 'W': 'ᴡ', 'X': 'x', 'Y': 'ʏ', 'Z': 'ᴢ'
    };
    return text.split('').map(char => uppercaseMap[char] || char).join('');
};

cmd({
    pattern: "uptime",
    alias: ["runtime", "up"],
    desc: "Check bot uptime",
    category: "utility",
    react: "⏱️",
    filename: __filename
},
async (conn, mek, m, { from, reply }) => {
    try {
        // ⏳ React - processing
        await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });
        
        // 1000ms delay to ensure react is visible
        await new Promise(resolve => setTimeout(resolve, 1000));

        const formatUptime = (seconds) => {
            const days = Math.floor(seconds / (3600 * 24));
            const hours = Math.floor((seconds % (3600 * 24)) / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            const secs = Math.floor(seconds % 60);
            
            let timeString = '';
            if (days > 0) timeString += `${days} day${days > 1 ? 's' : ''} `;
            if (hours > 0) timeString += `${hours} hour${hours > 1 ? 's' : ''} `;
            if (minutes > 0) timeString += `${minutes} minute${minutes > 1 ? 's' : ''} `;
            if (secs > 0 || timeString === '') timeString += `${secs} second${secs !== 1 ? 's' : ''}`;
            
            return timeString.trim();
        };

        const uptime = formatUptime(process.uptime());
        
        let msg = `❖ ── ✦ *${toStylistUpper('Bot Uptime')}* ✦ ── ❖\n\n`;
        msg += `╔═════ ⌈ *⚡ ${toStylistUpper('System Status')}* ⌋ ═════✧\n`;
        msg += `║ ⏱️ *${toStylistUpper('Uptime')}:* ${uptime}\n`;
        msg += `╚══════════════════════✧\n\n`;
        msg += `> 💫 _${toStylistUpper('Powered by Kamran-Md')}_`;

        await conn.sendMessage(from, { 
            text: msg,
            contextInfo: {
                isForwarded: true,
                forwardingScore: 999,
                mentionedJid: [m.sender]
            }
        }, { quoted: mek });

        // 800ms delay before success react
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // ✅ React - success
        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });

    } catch (e) {
        console.error("Error in uptime command:", e);
        // ❌ React - error
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
        await reply(`❌ ${toStylistUpper('Error checking uptime')}: ${e.message}`);
    }
});
