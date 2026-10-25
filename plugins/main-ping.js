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

// ==================== AUTO PING LISTENER (BODY HOOK) ====================
cmd({
    on: "body"
}, async (conn, mek, m, { from, body }) => {
    try {
        if (!body) return;

        const rawText = body.trim().toLowerCase();
        const triggers = ['ping', 'speed', 'pong'];

        // Triggers automatically in both Inbox and Groups
        if (triggers.includes(rawText)) {
            await executePing(conn, mek, from);
        }
    } catch (error) {
        console.error("Auto-Body Ping Error:", error);
    }
});

// ==================== PING COMMAND (Prefix Version) ====================
cmd({
    pattern: "ping",
    alias: ["speed", "pong"],
    use: '.ping',
    desc: "Check bot's response time.",
    category: "main",
    react: "⚡",
    filename: __filename
},
async (conn, mek, m, { from, reply }) => {
    try {
        await executePing(conn, mek, from);
    } catch (e) {
        console.error("Error in ping command:", e);
        reply(`An error occurred: ${e.message}`);
    }
});

// ==================== CORE PING LOGIC ====================
async function executePing(conn, mek, from) {
    const start = new Date().getTime();

    const reactionEmojis = ['🔥', '⚡', '🚀', '💨', '🎯', '🎉', '🌟', '💥', '🕐', '🔹'];
    const textEmojis = ['💎', '🏆', '⚡️', '🚀', '🎶', '🌠', '🌀', '🔱', '🛡️', '✨'];

    const reactionEmoji = reactionEmojis[Math.floor(Math.random() * reactionEmojis.length)];
    let textEmoji = textEmojis[Math.floor(Math.random() * textEmojis.length)];

    while (textEmoji === reactionEmoji) {
        textEmoji = textEmojis[Math.floor(Math.random() * textEmojis.length)];
    }

    await conn.sendMessage(from, {
        react: { text: textEmoji, key: mek.key }
    });

    const end = new Date().getTime();
    const responseTime = (end - start) / 1000;

    const text = `> ⚡ *${toStylistUpper('Kamran-Md Speed')} : ${responseTime.toFixed(2)}ms* ${reactionEmoji}`;

    await conn.sendMessage(from, {
        text,
        contextInfo: {
            mentionedJid: [mek.sender],
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: '120363418144382782@newsletter',
                newsletterName: "KAMI-MD",
                serverMessageId: 143
            }
        }
    }, { quoted: mek });
}

// ==================== PING2 COMMAND ====================
cmd({
    pattern: "ping2",
    desc: "Check bot's response time with detailed stats.",
    category: "main",
    react: "⚡",
    filename: __filename
},
async (conn, mek, m, { from, reply }) => {
    try {
        const startTime = Date.now();

        await new Promise(resolve => setTimeout(resolve, 300));

        const endTime = Date.now();
        const ping = endTime - startTime;

        let status;
        if (ping < 1000) status = `⚡ *${toStylistUpper('Fast & Responsive')}*`;
        else if (ping < 1400) status = `⚙️ *${toStylistUpper('Normal Speed')}*`;
        else status = `🐢 *${toStylistUpper('Slow Response')}*`;

        const msg = `
╔═════ ⌈ *⚡ ${toStylistUpper('Kamran-Md Ping')}* ⌋ ═════✧
║ 📶 *${toStylistUpper('Response')}:* ${ping} ms
║ 🧠 *${toStylistUpper('Status')}:* ${status}
║ 💫 *${toStylistUpper('Mode')}:* Active & Stable
╚══════════════════════✧
        `;

        await conn.sendMessage(from, { text: msg.trim() }, { quoted: mek });
    } catch (e) {
        console.log(e);
        reply(`⚠️ Error: ${e.message}`);
    }
});
