import { fileURLToPath } from 'url';
import path from 'path';
import os from 'os';
import fs from 'fs';
import axios from 'axios';
import { cmd, commands } from '../command.js';
import config from '../config.js';
import { runtime } from '../lib/functions.js';

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

// Format category with premium sleek styles & Stylist Uppercase Commands
const formatCategory = (category, cmds) => {
    const validCmds = cmds.filter(cmd => cmd.pattern && cmd.pattern.trim() !== '');
    
    if (validCmds.length === 0) return '';
    
    let title = `\n╭━━━〔 *${toStylistUpper(category.toUpperCase())}* 〕━━━┈⊷\n`;
    let body = validCmds.map(cmd => {
        const commandName = toStylistUpper(cmd.pattern || '');
        return `┃ ⚡ \`${commandName}\``;
    }).join('\n');
    let footer = `\n╰━━━━━━━━━━━━━━━━━━━┈⊷`;
    return `${title}${body}${footer}`;
};

// Function to validate URL
const isValidUrl = (url) => {
    if (!url || typeof url !== 'string' || url.trim() === '') return false;
    return url.startsWith('http://') || url.startsWith('https://');
};

// Local JSON file path for runtime custom settings persistence
const customSettingsPath = path.join(__dirname, '../lib/custom_settings.json');

const getCustomSettings = () => {
    try {
        if (fs.existsSync(customSettingsPath)) {
            return JSON.parse(fs.readFileSync(customSettingsPath, 'utf8'));
        }
    } catch (e) {}
    return {};
};

const saveCustomSettings = (newSettings) => {
    try {
        const current = getCustomSettings();
        const updated = { ...current, ...newSettings };
        fs.writeFileSync(customSettingsPath, JSON.stringify(updated, null, 2));
    } catch (e) {}
};

// ==================== 1. MAIN MENU & MENU2 COMMAND ====================
cmd({
    pattern: "menu3",
    alias: ["m2", "help2", "allmenu2", "fullmenu2", "menu2"],
    use: '.menu / .menu2',
    desc: "Show all bot commands",
    category: "main",
    react: "⚡",
    filename: __filename
},
async (conn, mek, m, { from, reply, userConfig }) => {
    try {
        await conn.sendPresenceUpdate('composing', from);
        
        let totalCommands = Object.keys(commands).length;
        
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
        for (const [category, cmds] of Object.entries(categorized)) {
            if (cmds && cmds.length > 0) {
                const section = formatCategory(category, cmds);
                if (section !== '') {
                    menuSections += section;
                }
            }
        }

        const custom = getCustomSettings();

        const BOT_NAME = userConfig?.BOT_NAME || config.BOT_NAME || "Bot";
        const OWNER_NAME = userConfig?.OWNER_NAME || config.OWNER_NAME || "Owner";
        const PREFIX = userConfig?.PREFIX || config.PREFIX || ".";
        const MODE = userConfig?.MODE || config.MODE || "private";
        const VERSION = userConfig?.VERSION || config.VERSION || "10.0.0";
        const DESCRIPTION = userConfig?.DESCRIPTION || config.DESCRIPTION || "";
        
        // Channel & Newsletter Settings
        const CHANNEL_LINK = custom.channelLink || userConfig?.CHANNEL_LINK || config.CHANNEL_LINK || "https://whatsapp.com/channel/YOUR_CHANNEL";
        const NEWSLETTER_JID = custom.newsletterJid || userConfig?.NEWSLETTER_JID || config.NEWSLETTER_JID || "120363418144382782@newsletter";
        const NEWSLETTER_NAME = userConfig?.NEWSLETTER_NAME || config.NEWSLETTER_NAME || BOT_NAME;
        
        // DP / Image URL Setup
        const BOT_DP = custom.botDp || userConfig?.BOT_DP || userConfig?.BOT_IMAGE || userConfig?.BOT_MEDIA_URL || config.BOT_DP || config.BOT_IMAGE || config.BOT_MEDIA_URL;
        
        // System Stats
        const totalRam = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
        const freeRam = (os.freemem() / 1024 / 1024 / 1024).toFixed(2);
        const platform = os.platform();

        let dec = `✨ *${toStylistUpper(BOT_NAME)} ᴍᴜʟᴛɪ-ᴅᴇᴠɪᴄᴇ* ✨

┌━━━〔 *ɪɴғᴏ ʙᴏx* 〕━━━┈⊷
┃ 👑 *${toStylistUpper('Owner')}:* ${OWNER_NAME}
┃ 📊 *${toStylistUpper('Commands')}:* ${totalCommands}
┃ ⏳ *${toStylistUpper('Runtime')}:* ${runtime(process.uptime())}
┃ 📡 *${toStylistUpper('Prefix')}:*  [  ${PREFIX}  ]
┃ ⚙️ *${toStylistUpper('Mode')}:* ${MODE}
┃ 🏷️ *${toStylistUpper('Version')}:* ${VERSION}
╰━━━━━━━━━━━━━━━━━━━┈⊷

┌━━━〔 *ꜱᴇᴛᴜᴘ & ꜱʏꜱᴛᴇᴍ* 〕━━━┈⊷
┃ 💾 *${toStylistUpper('Ram')}:* ${freeRam}GB / ${totalRam}GB
┃ 💻 *${toStylistUpper('Platform')}:* ${platform}
┃ 📢 *${toStylistUpper('Channel')}:* ${CHANNEL_LINK}
╰━━━━━━━━━━━━━━━━━━━┈⊷
${menuSections}

> 💡 _${DESCRIPTION || 'Powered by WhatsApp Bot'}_`;

        let imageToUse;
        const localImagePath = path.join(__dirname, '../lib/jawadmd.jpg');
        
        if (isValidUrl(BOT_DP)) {
            try {
                await axios.head(BOT_DP, { timeout: 3000 });
                imageToUse = BOT_DP;
            } catch (serverError) {
                imageToUse = localImagePath;
            }
        } else {
            imageToUse = localImagePath;
        }

        await conn.sendMessage(from, { 
            image: { url: imageToUse },
            caption: dec, 
            contextInfo: { 
                mentionedJid: [m.sender], 
                forwardingScore: 999, 
                isForwarded: true, 
                forwardedNewsletterMessageInfo: { 
                    newsletterJid: NEWSLETTER_JID, 
                    newsletterName: NEWSLETTER_NAME, 
                    serverMessageId: 143 
                } 
            } 
        }, { quoted: mek });

    } catch (e) { 
        console.log(e); 
        reply(`Error: ${e}`); 
    } 
});


// ==================== 2. SETMENU SETUP COMMAND ====================
cmd({
    pattern: "setmenu",
    alias: ["setmenuconfig"],
    use: '.setmenu dp <url> OR .setmenu channel <link>',
    desc: "Configure menu DP, channel link, and newsletter JID",
    category: "owner",
    react: "⚙️",
    filename: __filename
},
async (conn, mek, m, { from, args, reply }) => {
    try {
        const fullText = args.join(" ");

        if (!fullText) {
            return reply(`⚙️ *Menu Setup Guide:*
1️⃣ Set Menu DP Image URL:
   📌 \`.setmenu dp https://i.imgur.com/xxx.jpg\`

2️⃣ Set Channel Link & Newsletter JID:
   📌 \`.setmenu https://whatsapp.com/channel/xxx | 1203634...@@newsletter\``);
        }

        // Agar WhatsApp channel link diya hai direct
        if (fullText.includes("whatsapp.com/channel")) {
            const parts = fullText.split("|").map(v => v.trim());
            const channelLink = parts.find(p => p.includes("whatsapp.com/channel")) || parts[0];
            const newsletterJid = parts.find(p => p.includes("@newsletter")) || "120363418144382782@newsletter";

            saveCustomSettings({ channelLink, newsletterJid });
            return reply(`✅ *Success!* Channel Link & Newsletter JID updated successfully!\n📢 *Channel:* \`${channelLink}\`\n📡 *JID:* \`${newsletterJid}\``);
        }

        const subCommand = args[0]?.toLowerCase();

        if (subCommand === "dp" || subCommand === "image" || subCommand === "url") {
            const url = args.slice(1).join(" ").trim();
            if (!url || !isValidUrl(url)) {
                return reply("❌ Please provide a valid image URL!\nExample: `.setmenu dp https://i.imgur.com/xxx.jpg`");
            }
            saveCustomSettings({ botDp: url });
            return reply(`✅ *Success!* Menu DP URL has been updated successfully.\n🔗 \`${url}\``);
        }

        if (subCommand === "channel" || subCommand === "link" || subCommand === "newsletter") {
            const value = args.slice(1).join(" ");
            const parts = value.split("|").map(v => v.trim());
            const channelLink = parts[0];
            const newsletterJid = parts[1];

            if (!channelLink) {
                return reply("❌ Please provide a valid channel link!");
            }

            const updateData = { channelLink };
            if (newsletterJid) {
                updateData.newsletterJid = newsletterJid;
            }

            saveCustomSettings(updateData);
            return reply(`✅ *Success!* Menu Setup updated successfully!\n📢 *Channel:* \`${channelLink}\`\n📡 *Newsletter JID:* \`${newsletterJid || 'Unchanged'}\``);
        }

        return reply("❌ Invalid format! Type `.setmenu` to see instructions.");

    } catch (e) {
        console.log(e);
        reply(`Error: ${e}`);
    }
});
