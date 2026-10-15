import { fileURLToPath } from 'url';
import path from 'path';
import { cmd } from '../command.js';
import config from '../config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    pattern: "repo",
    alias: ["sc", "source", "script"],
    use: '.repo',
    desc: "Get bot repository and official website link",
    category: "main",
    react: "📁",
    filename: __filename
},
async (conn, mek, m, { from, reply, userConfig }) => {
    try {
        await conn.sendPresenceUpdate('composing', from);

        const BOT_NAME = userConfig?.BOT_NAME || config.BOT_NAME || "Kamran-Md";
        const OWNER_NAME = userConfig?.OWNER_NAME || config.OWNER_NAME || "Owner";
        
        // Direct image URL (same as menu & alive)
        const imageToUse = 'https://i.ibb.co/VpJ4HStx/848935937-1013301025114309-1591196057358903535-n.jpg';

        let dec = `❖ ── ✦ *${toStylistUpper(BOT_NAME)} ʀᴇᴘᴏsɪᴛᴏʀʏ* ✦ ── ❖

╔═════ ⌈ *⚡ ${toStylistUpper('Repository Info')}* ⌋ ═════✧
║ 🚀 *${toStylistUpper('Owner')}:* ${OWNER_NAME}
║ 🌐 *${toStylistUpper('Website')}:* https://kamran-md.site
╚══════════════════════✧

> 💫 _${toStylistUpper('Visit our official website for more updates and tools!')}_`;

        await conn.sendMessage(from, { 
            image: { url: imageToUse },
            caption: dec, 
            contextInfo: { 
                mentionedJid: [m.sender], 
                forwardingScore: 999, 
                isForwarded: true, 
                forwardedNewsletterMessageInfo: { 
                    newsletterJid: '120363418144382782@newsletter', 
                    newsletterName: BOT_NAME, 
                    serverMessageId: 143 
                } 
            } 
        }, { quoted: mek });

    } catch (e) { 
        console.log(e); 
        reply(`Error: ${e.message}`); 
    } 
});
