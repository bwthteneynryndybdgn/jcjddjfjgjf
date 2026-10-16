// plugins/antistatus.js - ESM Version
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

// ===============================
// ANTISTATUS COMMAND
// ===============================
cmd({
    pattern: "antistatus",
    alias: ["statuscontrol", "autostatus"],
    desc: "Toggle anti-status / status protection features",
    category: "settings",
    react: "🛡️",
    filename: __filename
},
async (conn, mek, m, { from, reply, isCreator, args, updateUserConfig, userConfig, sanitizedNumber }) => {
    try {
        if (!isCreator) {
            return reply(`*📛 ${toStylistUpper('This is an owner command.')}*`);
        }

        if (!args[0]) {
            let currentStatus = userConfig.ANTI_STATUS || 'off';
            return reply(`
╔═════ ⌈ *⚡ ${toStylistUpper('Anti-Status Settings')}* ⌋ ═════✧
║ 📌 *${toStylistUpper('Current')}:* ${currentStatus}
║
║ 📂 *${toStylistUpper('Options')}*:
║ • \`${toStylistUpper('.antistatus on')}\`
║ • \`${toStylistUpper('.antistatus off')}\`
║ • \`${toStylistUpper('.antistatus warn')}\`
║ • \`${toStylistUpper('.antistatus delete')}\`
╚══════════════════════✧

> 💫 _${toStylistUpper('Configure status handler settings')}_`.trim());
        }

        const value = args[0].toLowerCase();
        if (value !== 'on' && value !== 'off' && value !== 'warn' && value !== 'delete') {
            return reply(`❌ *${toStylistUpper('Please use: on, off, warn, or delete')}*`);
        }

        let configValue;
        let responseMsg = "";

        if (value === "on") {
            configValue = "true";
            responseMsg = `✅ *${toStylistUpper('Anti-status set to ON')}*`;
        } else if (value === "off") {
            configValue = "false";
            responseMsg = `✅ *${toStylistUpper('Anti-status set to OFF')}*`;
        } else if (value === "warn") {
            configValue = "warn";
            responseMsg = `✅ *${toStylistUpper('Anti-status set to WARN')}*`;
        } else if (value === "delete") {
            configValue = "delete";
            responseMsg = `✅ *${toStylistUpper('Anti-status set to DELETE')}*`;
        }

        userConfig.ANTI_STATUS = configValue;
        await updateUserConfig(sanitizedNumber, userConfig);

        await reply(responseMsg);

    } catch (error) {
        console.error('AntiStatus Error:', error);
        await reply(`❌ Error: ${error.message || error}`);
    }
});
