// plugins/menu.js - Premium Brand Edition
import { fileURLToPath } from 'url';
import path from 'path';
import os from 'os';
import { cmd, commands } from '../command.js';
import config from '../config.js';
import { runtime } from '../lib/functions.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- PREMIUM FONT HELPER (Small Caps) ---
const toStylistUpper = (text) => {
    if (!text || typeof text !== 'string') return '';
    const map = {
        'a': 'ᴀ', 'b': 'ʙ', 'c': 'ᴄ', 'd': 'ᴅ', 'e': 'ᴇ', 'f': 'ғ', 'g': 'ɢ', 'h': 'ʜ', 'i': 'ɪ',
        'j': 'ᴊ', 'k': 'ᴋ', 'l': 'ʟ', 'm': 'ᴍ', 'n': 'ɴ', 'o': 'ᴏ', 'p': 'ᴘ', 'q': 'ǫ', 'r': 'ʀ',
        's': 's', 't': 'ᴛ', 'u': 'ᴜ', 'v': 'ᴠ', 'w': 'ᴡ', 'x': 'x', 'y': 'ʏ', 'z': 'ᴢ',
        'A': 'ᴀ', 'B': 'ʙ', 'C': 'ᴄ', 'D': 'ᴅ', 'E': 'ᴇ', 'F': 'ғ', 'G': 'ɢ', 'H': 'ʜ', 'I': 'ɪ',
        'J': 'ᴊ', 'K': 'ᴋ', 'L': 'ʟ', 'M': 'ᴍ', 'N': 'ɴ', 'O': 'ᴏ', 'P': 'ᴘ', 'Q': 'ǫ', 'R': 'ʀ',
        'S': 's', 'T': 'ᴛ', 'U': 'ᴜ', 'V': 'ᴠ', 'W': 'ᴡ', 'X': 'x', 'Y': 'ʏ', 'Z': 'ᴢ',
        '0': '𝟶', '1': '𝟷', '2': '𝟸', '3': '𝟹', '4': '𝟺', '5': '𝟻', '6': '𝟼', '7': '𝟽', '8': '𝟾', '9': '𝟿'
    };
    return text.split('').map(char => map[char] || char).join('');
};

// --- CATEGORY FORMATTER ---
const formatCategory = (category, cmds) => {
    const validCmds = cmds.filter(cmd => cmd.pattern && cmd.pattern.trim() !== '');
    if (validCmds.length === 0) return '';
    
    // Luxury Header for Category
    let title = `\n╭───『 *${toStylistUpper(category.toUpperCase())}* 』───⳹\n`;
    let body = validCmds.map(cmd => {
        const commandName = toStylistUpper(cmd.pattern || '');
        const desc = cmd.desc ? ` _${toStylistUpper(cmd.desc)}_` : '';
        return `│ ◈ \`${commandName}\`${desc}`;
    }).join('\n');
    let footer = `\n╰──────────────────────⳹`;
    return `${title}${body}${footer}`;
};

cmd({
    pattern: "menu",
    alias: ["m", "help", "allmenu", "fullmenu", "list"],
    use: '.menu',
    desc: "Show Premium Bot Menu",
    category: "main",
    react: "💎",
    filename: __filename
},
async (conn, mek, m, { from, reply, userConfig }) => {
    try {
        await conn.sendPresenceUpdate('composing', from);
        
        // Config Values
        const BOT_NAME = userConfig?.BOT_NAME || config.BOT_NAME || "KAMRAN-MD";
        const OWNER_NAME = userConfig?.OWNER_NAME || config.OWNER_NAME || "Kamran";
        const PREFIX = userConfig?.PREFIX || config.PREFIX || ".";
        const MODE = userConfig?.MODE || config.MODE || "PRIVATE";
        const VERSION = userConfig?.VERSION || config.VERSION || "10.0.0";
        const DESCRIPTION = userConfig?.DESCRIPTION || config.DESCRIPTION || "Premium WhatsApp Bot";
        
        // Stats
        let totalCommands = Object.keys(commands).length;
        const uptime = runtime(process.uptime());
        
        // Categorize Commands
        const categories = [...new Set(Object.values(commands).map(c => c.category))].filter(cat => 
            cat && cat.trim() !== '' && cat !== 'undefined'
        );
        
        const categorized = {};
        categories.forEach(cat => {
            const categoryCommands = Object.values(commands).filter(c => c.category === cat);
            const validCommands = categoryCommands.filter(cmd => cmd.pattern && cmd.pattern.trim() !== '');
            if (validCommands.length > 0) {
                categorized[cat] = validCommands;
            }
        });

        let menuSections = '';
        // Sort categories alphabetically for better look
        const sortedKeys = Object.keys(categorized).sort();
        for (const key of sortedKeys) {
            const section = formatCategory(key, categorized[key]);
            if (section !== '') {
                menuSections += section;
            }
        }

        // --- BRAND DESIGN ---
        // Using a high-quality placeholder or your specific image
        const imageToUse = 'https://i.ibb.co/VpJ4HStx/848935937-1013301025114309-1591196057358903535-n.jpg';
        
        let dec = `╔════ ⌈ *${toStylistUpper(BOT_NAME)}* ⌋ ════╗
║      *ᴘʀᴇᴍɪᴜᴍ ᴍᴜʟᴛɪ-ᴅᴇᴠɪᴄᴇ*      
╚════════════════════════╝

╭───『 *👑 ᴏᴡɴᴇʀ ɪɴғᴏ* 』───⳹
│ ◈ *ɴᴀᴍᴇ:* ${toStylistUpper(OWNER_NAME)}
│ ◈ *ɴᴜᴍʙᴇʀ:* ${toStylistUpper("Check Bio")}
╰──────────────────────⳹

╭───『 *⚡ ʙᴏᴛ sᴛᴀᴛᴜs* 』───⳹
│ ◈ *ᴍᴏᴅᴇ:* ${toStylistUpper(MODE)}
│ ◈ *ᴘʀᴇғɪx:* [ ${PREFIX} ]
│ ◈ *ᴠᴇʀsɪᴏɴ:* ${toStylistUpper(VERSION)}
│ ◈ *ᴜᴘᴛɪᴍᴇ:* ${toStylistUpper(uptime)}
│ ◈ *ᴄᴏᴍᴍᴀɴᴅs:* ${totalCommands}
╰──────────────────────⳹
${menuSections}

> 💎 _${toStylistUpper(DESCRIPTION)}_
> 📢 _Channel: @Kamran-Md_`;

        await conn.sendMessage(from, { 
            image: { url: imageToUse },
            caption: dec, 
            contextInfo: { 
                mentionedJid: [m.sender], 
                forwardingScore: 999, 
                isForwarded: true, 
                forwardedNewsletterMessageInfo: { 
                    newsletterJid: '120363418144382782@newsletter', 
                    newsletterName: toStylistUpper(BOT_NAME), 
                    serverMessageId: 143 
                } 
            } 
        }, { quoted: mek });

    } catch (e) { 
        console.log(e); 
        reply(`❌ *Error generating menu:* ${e.message}`); 
    } 
});
