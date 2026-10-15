import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import axios from 'axios';
import FormData from 'form-data';
import path from 'path';

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

// Helper function to extract number from JID
function extractNumber(jid) {
    if (!jid) return '';
    return jid.split('@')[0];
}


cmd({
    pattern: "statuslike",
    alias: ["statusreact"],
    desc: "Toggle auto view status",
    category: "settings",
    react: "👁️",
    filename: __filename
},
async (conn, mek, m, { from, reply, isCreator, args, prefix, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) {
        return reply(`*📛 ${toStylistUpper('This is an owner command.')}*`);
    }

    if (!args[0]) {
        return reply(`📌 *${toStylistUpper('Usage')}:* .statuslike on/off\n*${toStylistUpper('Current')}:* ${userConfig.AUTO_LIKE_STATUS}`);
    }

    const value = args[0].toLowerCase();
    if (value !== 'on' && value !== 'off') {
        return reply(`❌ *${toStylistUpper('Please use: on or off')}*`);
    }

    const newValue = value === 'on' ? 'true' : 'false';
    userConfig.AUTO_LIKE_STATUS = newValue;
    await updateUserConfig(sanitizedNumber, userConfig);
    
    await reply(`✅ *${toStylistUpper('Auto Like Status set to')}* ${newValue}`);
});

// ===============================
// BOT DP COMMAND - Using ImgBB
// ===============================
cmd({
    pattern: "botdp",
    alias: ["botimage", "botpic", "botphoto"],
    desc: "Set bot display picture",
    category: "settings",
    react: "🖼️",
    filename: __filename
},
async (conn, mek, m, { from, reply, isCreator, args, updateUserConfig, userConfig, sanitizedNumber, quoted }) => {
    if (!isCreator) {
        return reply(`*📛 ${toStylistUpper('This is an owner command.')}*`);
    }

    try {
        let imageUrl = args[0];

        const IMGBB_API_KEYS = [
            'ebb2d6cad946fa45d7d9c4cc7dfa87e3',
            'b9b79efc2a2cf5380b57974bba4ce6d4',
            '9f47b49c2c1ea0bdb3f4acc4ebde2119',
            'a7c9712190de7a0d3c27e12ac5e4c3da',
            '55ec55ce1c92a23b47d958a1db63c486'
        ];

        function getRandomApiKey() {
            const randomIndex = Math.floor(Math.random() * IMGBB_API_KEYS.length);
            return IMGBB_API_KEYS[randomIndex];
        }

        if (!imageUrl && m.quoted) {
            const quotedMsg = m.quoted;
            const mimeType = (quotedMsg.msg || quotedMsg).mimetype || '';
            
            if (!mimeType || !mimeType.includes('image')) {
                return reply(`❌ *${toStylistUpper('Please reply to an image')}*`);
            }

            await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

            const mediaBuffer = await quotedMsg.download();
            const apiKey = getRandomApiKey();

            const form = new FormData();
            form.append('key', apiKey);
            form.append('image', mediaBuffer.toString('base64'));
            form.append('name', 'botdp');

            const response = await axios.post("https://api.imgbb.com/1/upload", form, {
                headers: form.getHeaders(),
                timeout: 60000
            });

            imageUrl = response.data?.data?.url;

            if (!imageUrl) throw new Error("Upload failed - no URL returned");

            await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
        }

        if (!imageUrl || !imageUrl.startsWith("http")) {
            return reply(`❌ *${toStylistUpper('Provide a valid image URL or reply to an image.')}*`);
        }

        userConfig.BOT_IMAGE = imageUrl;
        await updateUserConfig(sanitizedNumber, userConfig);

        let caption = `╔═════ ⌈ *⚡ ${toStylistUpper('Bot DP Updated')}* ⌋ ═════✧\n`;
        caption += `║ 🔗 *${toStylistUpper('URL')}:* ${imageUrl}\n`;
        caption += `╚══════════════════════✧\n\n`;
        caption += `> 💫 _${toStylistUpper('Updated by Kamran-Md')}_`;

        await conn.sendMessage(from, { 
            image: { url: imageUrl },
            caption: caption 
        }, { quoted: mek });

    } catch (error) {
        console.error('BotDP Error:', error);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        await reply(`❌ Error: ${error.message || error}`);
    }
});

// ===============================
// WELCOME COMMAND
// ===============================
cmd({
    pattern: "welcome",
    alias: ["welcome"],
    desc: "Toggle welcome messages",
    category: "settings",
    react: "🎉",
    filename: __filename
},
async (conn, mek, m, { from, reply, isCreator, args, prefix, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) {
        return reply(`*📛 ${toStylistUpper('This is an owner command.')}*`);
    }

    if (!args[0]) {
        return reply(`📌 *${toStylistUpper('Usage')}:* welcome on/off\n*${toStylistUpper('Current')}:* ${userConfig.WELCOME}`);
    }

    const value = args[0].toLowerCase();
    if (value !== 'on' && value !== 'off') {
        return reply(`❌ *${toStylistUpper('Please use: on or off')}*`);
    }

    const newValue = value === 'on' ? 'true' : 'false';
    userConfig.WELCOME = newValue;
    await updateUserConfig(sanitizedNumber, userConfig);
    
    await reply(`✅ *${toStylistUpper('Welcome set to')}* ${newValue}`);
});

// ===============================
// GOODBYE COMMAND
// ===============================
cmd({
    pattern: "goodbye",
    alias: ["goodbye"],
    desc: "Toggle goodbye messages",
    category: "settings",
    react: "👋",
    filename: __filename
},
async (conn, mek, m, { from, reply, isCreator, args, prefix, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) {
        return reply(`*📛 ${toStylistUpper('This is an owner command.')}*`);
    }

    if (!args[0]) {
        return reply(`📌 *${toStylistUpper('Usage')}:* goodbye on/off\n*${toStylistUpper('Current')}:* ${userConfig.GOODBYE}`);
    }

    const value = args[0].toLowerCase();
    if (value !== 'on' && value !== 'off') {
        return reply(`❌ *${toStylistUpper('Please use: on or off')}*`);
    }

    const newValue = value === 'on' ? 'true' : 'false';
    userConfig.GOODBYE = newValue;
    await updateUserConfig(sanitizedNumber, userConfig);
    
    await reply(`✅ *${toStylistUpper('Goodbye set to')}* ${newValue}`);
});

// ===============================
// SET WELCOME COMMAND
// ===============================
cmd({
    pattern: "setwelcome",
    alias: ["setwelcome"],
    desc: "Set custom welcome message",
    category: "settings",
    react: "✏️",
    filename: __filename
},
async (conn, mek, m, { from, reply, isCreator, args, prefix, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) {
        return reply(`*📛 ${toStylistUpper('This is an owner command.')}*`);
    }

    if (!args[0]) {
        return reply(`📌 *${toStylistUpper('Current welcome message')}:*\n\n${userConfig.WELCOME_MESSAGE || 'Not set'}\n\n*${toStylistUpper('Usage')}:* .setwelcome <message>`);
    }

    const welcomeMessage = args.join(' ');
    userConfig.WELCOME_MESSAGE = welcomeMessage;
    await updateUserConfig(sanitizedNumber, userConfig);
    
    await reply(`✅ *${toStylistUpper('Welcome message set to')}:*\n\n${welcomeMessage}`);
});

// ===============================
// SET GOODBYE COMMAND
// ===============================
cmd({
    pattern: "setgoodbye",
    alias: ["setgoodbye"],
    desc: "Set custom goodbye message",
    category: "settings",
    react: "✏️",
    filename: __filename
},
async (conn, mek, m, { from, reply, isCreator, args, prefix, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) {
        return reply(`*📛 ${toStylistUpper('This is an owner command.')}*`);
    }

    if (!args[0]) {
        return reply(`📌 *${toStylistUpper('Current goodbye message')}:*\n\n${userConfig.GOODBYE_MESSAGE || 'Not set'}\n\n*${toStylistUpper('Usage')}:* .setgoodbye <message>`);
    }

    const goodbyeMessage = args.join(' ');
    userConfig.GOODBYE_MESSAGE = goodbyeMessage;
    await updateUserConfig(sanitizedNumber, userConfig);
    
    await reply(`✅ *${toStylistUpper('Goodbye message set to')}:*\n\n${goodbyeMessage}`);
});

// ===============================
// BANLIST COMMAND
// ===============================
cmd({
    pattern: "banlist",
    alias: ["banlist", "banned"],
    desc: "Show list of banned users",
    category: "settings",
    react: "📋",
    filename: __filename
},
async (conn, mek, m, { from, reply, isCreator, args, prefix, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) {
        return reply(`*📛 ${toStylistUpper('This is an owner command.')}*`);
    }

    let bannedList = Array.isArray(userConfig.BANNED) ? userConfig.BANNED : [];

    if (bannedList.length === 0) {
        return reply(`📋 *${toStylistUpper('No banned users found.')}*`);
    }

    let listText = `╔═════ ⌈ *⚡ ${toStylistUpper('Banned Users')}* ⌋ ═════✧\n`;
    for (let i = 0; i < bannedList.length; i++) {
        const user = bannedList[i];
        const userNumber = extractNumber(user);
        listText += `║ ${i + 1}. ${userNumber}\n`;
    }
    listText += `╚══════════════════════✧`;

    await reply(listText);
});

// ===============================
// BAN COMMAND
// ===============================
cmd({
    pattern: "ban",
    alias: ["ban"],
    desc: "Ban a user from using the bot",
    category: "settings",
    react: "🔨",
    filename: __filename
},
async (conn, mek, m, { from, reply, isCreator, args, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) {
        return reply(`*📛 ${toStylistUpper('This is an owner command.')}*`);
    }

    let target = m.mentionedJid?.[0] || (m.quoted?.sender ?? null);

    if (!target && args[0]) {
        if (args[0].includes('@')) {
            target = args[0];
        } else {
            return reply(`⚠️ *${toStylistUpper('Please mention the user or reply to their message.')}*`);
        }
    }

    if (!target) {
        return reply(`⚠️ *${toStylistUpper('Please provide a target to ban!')}*`);
    }

    if (target === conn.user.id) {
        return reply(`🤖 *${toStylistUpper('I can\'t ban myself!')}*`);
    }

    const ownerJid = userConfig.OWNER_NUMBER || config.OWNER_NUMBER;
    const ownerWithSuffix = ownerJid.includes('@') ? ownerJid : ownerJid + '@s.whatsapp.net';
    if (target === ownerWithSuffix) {
        return reply(`👑 *${toStylistUpper('Cannot ban the owner!')}*`);
    }

    let bannedList = Array.isArray(userConfig.BANNED) ? [...userConfig.BANNED] : [];

    if (bannedList.includes(target)) {
        return reply(`❌ *${toStylistUpper('This user is already banned!')}*`);
    }

    bannedList.push(target);
    userConfig.BANNED = bannedList;
    await updateUserConfig(sanitizedNumber, userConfig);
    
    await reply(`✅ *${toStylistUpper('User banned successfully!')}*\n\n${toStylistUpper('User')}: ${target}`);
});

// ===============================
// UNBAN COMMAND
// ===============================
cmd({
    pattern: "unban",
    alias: ["unban"],
    desc: "Unban a user from using the bot",
    category: "settings",
    react: "🔓",
    filename: __filename
},
async (conn, mek, m, { from, reply, isCreator, args, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) {
        return reply(`*📛 ${toStylistUpper('This is an owner command.')}*`);
    }

    let target = m.mentionedJid?.[0] || (m.quoted?.sender ?? null);

    if (!target && args[0]) {
        if (args[0].includes('@')) {
            target = args[0];
        } else {
            return reply(`⚠️ *${toStylistUpper('Please mention the user or reply to their message.')}*`);
        }
    }

    if (!target) {
        return reply(`⚠️ *${toStylistUpper('Please provide a target to unban!')}*`);
    }

    let bannedList = Array.isArray(userConfig.BANNED) ? [...userConfig.BANNED] : [];

    if (!bannedList.includes(target)) {
        return reply(`❌ *${toStylistUpper('This user is not banned!')}*`);
    }

    bannedList = bannedList.filter(jid => jid !== target);
    userConfig.BANNED = bannedList;
    await updateUserConfig(sanitizedNumber, userConfig);
    
    await reply(`✅ *${toStylistUpper('User unbanned successfully!')}*\n\n${toStylistUpper('User')}: ${target}`);
});

// ===============================
// SUDO COMMAND
// ===============================
cmd({
    pattern: "sudo",
    alias: ["sudo"],
    desc: "Add a user to sudo list",
    category: "settings",
    react: "👑",
    filename: __filename
},
async (conn, mek, m, { from, reply, isCreator, args, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) {
        return reply(`*📛 ${toStylistUpper('This is an owner command.')}*`);
    }

    let target = m.mentionedJid?.[0] || (m.quoted?.sender ?? null);

    if (!target && args[0]) {
        if (args[0].includes('@')) {
            target = args[0];
        } else {
            return reply(`⚠️ *${toStylistUpper('Please mention the user or reply to their message.')}*`);
        }
    }

    if (!target) {
        return reply(`⚠️ *${toStylistUpper('Please provide a target to add to sudo!')}*`);
    }

    if (target === conn.user.id) {
        return reply(`🤖 *${toStylistUpper('I can\'t sudo myself!')}*`);
    }

    let sudoList = Array.isArray(userConfig.SUDO) ? [...userConfig.SUDO] : [];

    if (sudoList.includes(target)) {
        return reply(`❌ *${toStylistUpper('This user is already in sudo list!')}*`);
    }

    sudoList.push(target);
    userConfig.SUDO = sudoList;
    await updateUserConfig(sanitizedNumber, userConfig);
    
    await reply(`✅ *${toStylistUpper('User added to sudo list successfully!')}*\n\n${toStylistUpper('User')}: ${target}`);
});

// ===============================
// DELSUDO COMMAND
// ===============================
cmd({
    pattern: "delsudo",
    alias: ["delsudo", "removesudo"],
    desc: "Remove a user from sudo list",
    category: "settings",
    react: "👑",
    filename: __filename
},
async (conn, mek, m, { from, reply, isCreator, args, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) {
        return reply(`*📛 ${toStylistUpper('This is an owner command.')}*`);
    }

    let target = m.mentionedJid?.[0] || (m.quoted?.sender ?? null);

    if (!target && args[0]) {
        if (args[0].includes('@')) {
            target = args[0];
        } else {
            return reply(`⚠️ *${toStylistUpper('Please mention the user or reply to their message.')}*`);
        }
    }

    if (!target) {
        return reply(`⚠️ *${toStylistUpper('Please provide a target to remove from sudo!')}*`);
    }

    let sudoList = Array.isArray(userConfig.SUDO) ? [...userConfig.SUDO] : [];

    if (!sudoList.includes(target)) {
        return reply(`❌ *${toStylistUpper('This user is not in sudo list!')}*`);
    }

    sudoList = sudoList.filter(jid => jid !== target);
    userConfig.SUDO = sudoList;
    await updateUserConfig(sanitizedNumber, userConfig);
    
    await reply(`✅ *${toStylistUpper('User removed from sudo list successfully!')}*\n\n${toStylistUpper('User')}: ${target}`);
});

// ===============================
// LISTSUDO COMMAND
// ===============================
cmd({
    pattern: "listsudo",
    alias: ["listsudo", "sudoers"],
    desc: "Show list of sudo users",
    category: "settings",
    react: "📋",
    filename: __filename
},
async (conn, mek, m, { from, reply, isCreator, args, prefix, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) {
        return reply(`*📛 ${toStylistUpper('This is an owner command.')}*`);
    }

    let sudoList = Array.isArray(userConfig.SUDO) ? userConfig.SUDO : [];

    if (sudoList.length === 0) {
        return reply(`📋 *${toStylistUpper('No sudo users found.')}*`);
    }

    let listText = `╔═════ ⌈ *⚡ ${toStylistUpper('Sudo Users')}* ⌋ ═════✧\n`;
    for (let i = 0; i < sudoList.length; i++) {
        const user = sudoList[i];
        const userNumber = extractNumber(user);
        listText += `║ ${i + 1}. ${userNumber}\n`;
    }
    listText += `╚══════════════════════✧`;

    await reply(listText);
});

// ===============================
// ANTIEDIT COMMAND
// ===============================
cmd({
    pattern: "antiedit",
    alias: ["antiedit"],
    desc: "Toggle anti-edit feature",
    category: "settings",
    react: "✏️",
    filename: __filename
},
async (conn, mek, m, { from, reply, isCreator, args, prefix, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) {
        return reply(`*📛 ${toStylistUpper('This is an owner command.')}*`);
    }

    if (!args[0]) {
        return reply(`📌 *${toStylistUpper('Usage')}:* antiedit on/off\n*${toStylistUpper('Current')}:* ${userConfig.ANTI_EDIT}`);
    }

    const value = args[0].toLowerCase();
    if (value !== 'on' && value !== 'off') {
        return reply(`❌ *${toStylistUpper('Please use: on or off')}*`);
    }

    const newValue = value === 'on' ? 'true' : 'false';
    userConfig.ANTI_EDIT = newValue;
    await updateUserConfig(sanitizedNumber, userConfig);
    
    await reply(`✅ *${toStylistUpper('Anti-edit set to')}* ${newValue}`);
});

// ===============================
// EDITPATH COMMAND
// ===============================
cmd({
    pattern: "editpath",
    alias: ["editpath"],
    desc: "Set where to show edited messages",
    category: "settings",
    react: "📍",
    filename: __filename
},
async (conn, mek, m, { from, reply, isCreator, args, prefix, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) {
        return reply(`*📛 ${toStylistUpper('This is an owner command.')}*`);
    }

    if (!args[0]) {
        return reply(`📌 *${toStylistUpper('Usage')}:* editpath inbox/same\n*${toStylistUpper('Current path')}:* ${userConfig.ANTIEDIT_PATH || 'inbox'}`);
    }

    const value = args[0].toLowerCase();
    if (value !== 'inbox' && value !== 'same') {
        return reply(`❌ *${toStylistUpper('Please use: inbox or same')}*`);
    }

    userConfig.ANTIEDIT_PATH = value;
    await updateUserConfig(sanitizedNumber, userConfig);
    
    await reply(`✅ *${toStylistUpper('Edit path set to')}* ${value}`);
});

// ===============================
// AUTOREAD COMMAND
// ===============================
cmd({
    pattern: "autoread",
    alias: ["autoread", "readmsg", "autoreadmsg"],
    desc: "Toggle auto-read messages feature",
    category: "settings",
    react: "👁️",
    filename: __filename
},
async (conn, mek, m, { from, reply, isCreator, args, prefix, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) {
        return reply(`*📛 ${toStylistUpper('This is an owner command.')}*`);
    }

    if (!args[0]) {
        return reply(`📌 *${toStylistUpper('Usage')}:* autoread on/off\n*${toStylistUpper('Current')}:* ${userConfig.READ_MESSAGE || 'false'}`);
    }

    const value = args[0].toLowerCase();
    if (value !== 'on' && value !== 'off') {
        return reply(`❌ *${toStylistUpper('Please use: on or off')}*`);
    }

    const newValue = value === 'on' ? 'true' : 'false';
    userConfig.READ_MESSAGE = newValue;
    await updateUserConfig(sanitizedNumber, userConfig);
    
    await reply(`✅ *${toStylistUpper('Auto-read set to')}* ${newValue}`);
});

// ===============================
// ANTI LINK COMMAND
// ===============================
cmd({
    pattern: "antilink",
    alias: ["linkblock"],
    desc: "Toggle anti-link protection",
    category: "settings",
    react: "🚫",
    filename: __filename
},
async (conn, mek, m, { from, reply, isCreator, args, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) {
        return reply(`*📛 ${toStylistUpper('This is an owner command.')}*`);
    }

    if (!args[0]) {
        return reply(`📌 *${toStylistUpper('Usage')}:* antilink on/off/warn/delete`);
    }

    const value = args[0].toLowerCase();
    if (value !== 'on' && value !== 'off' && value !== 'warn' && value !== 'delete') {
        return reply(`❌ *${toStylistUpper('Please use: on, off, warn, or delete')}*`);
    }

    let configValue;
    let responseMsg = "";
    
    if (value === "on") {
        configValue = "true";
        responseMsg = `✅ *${toStylistUpper('Anti-link set to ON')}*`;
    } else if (value === "off") {
        configValue = "false";
        responseMsg = `✅ *${toStylistUpper('Anti-link set to OFF')}*`;
    } else if (value === "warn") {
        configValue = "warn";
        responseMsg = `✅ *${toStylistUpper('Anti-link set to WARN')}*`;
    } else if (value === "delete") {
        configValue = "delete";
        responseMsg = `✅ *${toStylistUpper('Anti-link set to DELETE')}*`;
    }

    userConfig.ANTI_LINK = configValue;
    await updateUserConfig(sanitizedNumber, userConfig);
    
    await reply(responseMsg);
});

// ===============================
// ANTI DELETE COMMAND
// ===============================
cmd({
    pattern: "antidelete",
    alias: ["antidel", "delblock"],
    desc: "Toggle anti-delete message protection",
    category: "settings",
    react: "🗑️",
    filename: __filename
},
async (conn, mek, m, { from, reply, isCreator, args, prefix, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) {
        return reply(`*📛 ${toStylistUpper('This is an owner command.')}*`);
    }

    if (!args[0]) {
        return reply(`📌 *${toStylistUpper('Usage')}:* antidelete on/off\n*${toStylistUpper('Current')}:* ${userConfig.ANTI_DELETE || 'false'}`);
    }

    const value = args[0].toLowerCase();
    if (value !== 'on' && value !== 'off') {
        return reply(`❌ *${toStylistUpper('Please use: on or off')}*`);
    }

    const newValue = value === 'on' ? 'true' : 'false';
    userConfig.ANTI_DELETE = newValue;
    await updateUserConfig(sanitizedNumber, userConfig);
    
    await reply(`✅ *${toStylistUpper('Anti Delete set to')}* ${newValue}`);
});

// ===============================
// RECORDING COMMAND
// ===============================
cmd({
    pattern: "recording",
    alias: ["autorecording"],
    desc: "Toggle auto recording presence",
    category: "settings",
    react: "🎙️",
    filename: __filename
},
async (conn, mek, m, { from, reply, isCreator, args, prefix, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) {
        return reply(`*📛 ${toStylistUpper('This is an owner command.')}*`);
    }

    if (!args[0]) {
        return reply(`📌 *${toStylistUpper('Usage')}:* autorecord on/off\n*${toStylistUpper('Current')}:* ${userConfig.AUTO_RECORDING}`);
    }

    const value = args[0].toLowerCase();
    if (value !== 'on' && value !== 'off') {
        return reply(`❌ *${toStylistUpper('Please use: on or off')}*`);
    }

    const newValue = value === 'on' ? 'true' : 'false';
    userConfig.AUTO_RECORDING = newValue;
    await updateUserConfig(sanitizedNumber, userConfig);
    
    await reply(`✅ *${toStylistUpper('Auto Recording set to')}* ${newValue}`);
});

// ===============================
// STATUS VIEW COMMAND
// ===============================
cmd({
    pattern: "statusview",
    alias: ["autoview"],
    desc: "Toggle auto view status",
    category: "settings",
    react: "👁️",
    filename: __filename
},
async (conn, mek, m, { from, reply, isCreator, args, prefix, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) {
        return reply(`*📛 ${toStylistUpper('This is an owner command.')}*`);
    }

    if (!args[0]) {
        return reply(`📌 *${toStylistUpper('Usage')}:* autoview on/off\n*${toStylistUpper('Current')}:* ${userConfig.AUTO_VIEW_STATUS}`);
    }

    const value = args[0].toLowerCase();
    if (value !== 'on' && value !== 'off') {
        return reply(`❌ *${toStylistUpper('Please use: on or off')}*`);
    }

    const newValue = value === 'on' ? 'true' : 'false';
    userConfig.AUTO_VIEW_STATUS = newValue;
    await updateUserConfig(sanitizedNumber, userConfig);
    
    await reply(`✅ *${toStylistUpper('Auto View Status set to')}* ${newValue}`);
});

// ===============================
// AUTO REACT COMMAND
// ===============================
cmd({
    pattern: "autoreact",
    alias: ["autoreaction", "reactauto"],
    desc: "Toggle auto react to messages",
    category: "settings",
    react: "🤖",
    filename: __filename
},
async (conn, mek, m, { from, reply, isCreator, args, prefix, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) {
        return reply(`*📛 ${toStylistUpper('This is an owner command.')}*`);
    }

    if (!args[0]) {
        return reply(`📌 *${toStylistUpper('Usage')}:* autoreact on/off\n*${toStylistUpper('Current')}:* ${userConfig.AUTO_REACT}`);
    }

    const value = args[0].toLowerCase();
    if (value !== 'on' && value !== 'off') {
        return reply(`❌ *${toStylistUpper('Please use: on or off')}*`);
    }

    const newValue = value === 'on' ? 'true' : 'false';
    userConfig.AUTO_REACT = newValue;
    await updateUserConfig(sanitizedNumber, userConfig);
    
    await reply(`✅ *${toStylistUpper('Auto React set to')}* ${newValue}`);
});

// ===============================
// ANTI CALL COMMAND
// ===============================
cmd({
    pattern: "anticall",
    alias: ["antcall", "callblock"],
    desc: "Toggle anti-call protection",
    category: "settings",
    react: "📵",
    filename: __filename
},
async (conn, mek, m, { from, reply, isCreator, args, prefix, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) {
        return reply(`*📛 ${toStylistUpper('This is an owner command.')}*`);
    }

    if (!args[0]) {
        return reply(`📌 *${toStylistUpper('Usage')}:* anticall on/off\n*${toStylistUpper('Current')}:* ${userConfig.ANTI_CALL || 'false'}`);
    }

    const value = args[0].toLowerCase();
    if (value !== 'on' && value !== 'off') {
        return reply(`❌ *${toStylistUpper('Please use: on or off')}*`);
    }

    const newValue = value === 'on' ? 'true' : 'false';
    userConfig.ANTI_CALL = newValue;
    await updateUserConfig(sanitizedNumber, userConfig);
    
    await reply(`✅ *${toStylistUpper('Anti-Call set to')}* ${newValue}`);
});

// ===============================
// ANTI CALL MESSAGE COMMAND
// ===============================
cmd({
    pattern: "anticallmsg",
    alias: ["callmsg", "rejectmsg"],
    desc: "Set custom anti-call rejection message",
    category: "settings",
    react: "📝",
    filename: __filename
},
async (conn, mek, m, { from, reply, isCreator, args, prefix, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) {
        return reply(`*📛 ${toStylistUpper('This is an owner command.')}*`);
    }

    if (!args[0]) {
        const currentMsg = userConfig.REJECT_MSG || config.REJECT_MSG || "*📞 Call not allowed on this number*";
        return reply(`📌 *${toStylistUpper('Current Reject Message')}:*\n${currentMsg}\n\n*${toStylistUpper('Usage')}:* anticallmsg <message>`);
    }

    const newMsg = args.join(' ');
    userConfig.REJECT_MSG = newMsg;
    await updateUserConfig(sanitizedNumber, userConfig);
    
    await reply(`✅ *${toStylistUpper('Anti-Call Reject Message set to')}:*\n${newMsg}`);
});

// ===============================
// ADMIN ACTION COMMAND
// ===============================
cmd({
    pattern: "adminaction",
    alias: ["adminnotify"],
    desc: "Toggle admin action notifications",
    category: "settings",
    react: "👑",
    filename: __filename
},
async (conn, mek, m, { from, reply, isCreator, args, prefix, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) {
        return reply(`*📛 ${toStylistUpper('This is an owner command.')}*`);
    }

    if (!args[0]) {
        return reply(`📌 *${toStylistUpper('Usage')}:* adminaction on/off\n*${toStylistUpper('Current')}:* ${userConfig.ADMIN_ACTION}`);
    }

    const value = args[0].toLowerCase();
    if (value !== 'on' && value !== 'off') {
        return reply(`❌ *${toStylistUpper('Please use: on or off')}*`);
    }

    const newValue = value === 'on' ? 'true' : 'false';
    userConfig.ADMIN_ACTION = newValue;
    await updateUserConfig(sanitizedNumber, userConfig);
    
    await reply(`✅ *${toStylistUpper('Admin Action Notifications set to')}* ${newValue}`);
});

// ===============================
// AUTO TYPING COMMAND
// ===============================
cmd({
    pattern: "autotyping",
    alias: ["typing"],
    desc: "Toggle auto typing in chats",
    category: "settings",
    react: "⌨️",
    filename: __filename
},
async (conn, mek, m, { from, reply, isCreator, args, prefix, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) {
        return reply(`*📛 ${toStylistUpper('This is an owner command.')}*`);
    }

    if (!args[0]) {
        return reply(`📌 *${toStylistUpper('Usage')}:* autotyping on/off\n*${toStylistUpper('Current')}:* ${userConfig.AUTO_TYPING || 'false'}`);
    }

    const value = args[0].toLowerCase();
    if (value !== 'on' && value !== 'off') {
        return reply(`❌ *${toStylistUpper('Please use: on or off')}*`);
    }

    const newValue = value === 'on' ? 'true' : 'false';
    userConfig.AUTO_TYPING = newValue;
    await updateUserConfig(sanitizedNumber, userConfig);
    
    await reply(`✅ *${toStylistUpper('Auto Typing set to')}* ${newValue}`);
});

// ===============================
// ONLINE COMMAND
// ===============================
cmd({
    pattern: "online",
    alias: ["alwaysonline", "alwayson"],
    desc: "Toggle always online status",
    category: "settings",
    react: "💚",
    filename: __filename
},
async (conn, mek, m, { from, reply, isCreator, args, prefix, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) {
        return reply(`*📛 ${toStylistUpper('This is an owner command.')}*`);
    }

    if (!args[0]) {
        return reply(`📌 *${toStylistUpper('Usage')}:* online on/off\n*${toStylistUpper('Current')}:* ${userConfig.ALWAYS_ONLINE || 'false'}`);
    }

    const value = args[0].toLowerCase();
    if (value !== 'on' && value !== 'off') {
        return reply(`❌ *${toStylistUpper('Please use: on or off')}*`);
    }

    const newValue = value === 'on' ? 'true' : 'false';
    userConfig.ALWAYS_ONLINE = newValue;
    await updateUserConfig(sanitizedNumber, userConfig);
    
    await reply(`✅ *${toStylistUpper('Always Online set to')}* ${newValue}`);
});

// ===============================
// MODE COMMAND
// ===============================
cmd({
    pattern: "mode",
    alias: ["mod"],
    desc: "Change bot mode (public/private/inbox)",
    category: "settings",
    react: "🌐",
    filename: __filename
},
async (conn, mek, m, { from, reply, isCreator, args, prefix, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) {
        return reply(`*📛 ${toStylistUpper('This is an owner command.')}*`);
    }

    if (!args[0]) {
        return reply(`📌 *${toStylistUpper('Usage')}:* mode public/private/inbox\n*${toStylistUpper('Current')}:* ${userConfig.MODE}`);
    }

    const mode = args[0].toLowerCase();
    if (!['public', 'private', 'inbox'].includes(mode)) {
        return reply(`❌ *${toStylistUpper('Available modes: public, private, inbox')}*`);
    }

    userConfig.MODE = mode;
    await updateUserConfig(sanitizedNumber, userConfig);
    
    await reply(`✅ *${toStylistUpper('Bot mode set to')}* ${mode}`);
});

// ===============================
// PREFIX COMMAND
// ===============================
cmd({
    pattern: "prefix",
    desc: "Change command prefix",
    category: "settings",
    react: "⚡",
    filename: __filename
},
async (conn, mek, m, { from, reply, isCreator, args, prefix, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) {
        return reply(`*📛 ${toStylistUpper('This is an owner command.')}*`);
    }

    if (!args[0]) {
        return reply(`📌 *${toStylistUpper('Usage')}:* prefix <new_prefix>\n*${toStylistUpper('Current')}:* ${userConfig.PREFIX}`);
    }

    const newPrefix = args[0];
    if (newPrefix.length > 2) {
        return reply(`❌ *${toStylistUpper('Prefix must be 1-2 characters max')}*`);
    }

    userConfig.PREFIX = newPrefix;
    await updateUserConfig(sanitizedNumber, userConfig);
    
    await reply(`✅ *${toStylistUpper('Prefix changed to')}* ${newPrefix}`);
});

// ===============================
// BOT NAME COMMAND
// ===============================
cmd({
    pattern: "botname",
    alias: ["name"],
    desc: "Change bot name",
    category: "settings",
    react: "🤖",
    filename: __filename
},
async (conn, mek, m, { from, reply, isCreator, args, prefix, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) {
        return reply(`*📛 ${toStylistUpper('This is an owner command.')}*`);
    }

    if (!args[0]) {
        return reply(`📌 *${toStylistUpper('Usage')}:* botname <new_name>\n*${toStylistUpper('Current')}:* ${userConfig.BOT_NAME || config.BOT_NAME}`);
    }

    const newName = args.join(' ');
    if (newName.length > 30) {
        return reply(`❌ *${toStylistUpper('Bot name must be under 30 characters')}*`);
    }

    userConfig.BOT_NAME = newName;
    await updateUserConfig(sanitizedNumber, userConfig);
    
    await reply(`✅ *${toStylistUpper('Bot name set to')}* ${newName}`);
});

// ===============================
// OWNER NAME COMMAND
// ===============================
cmd({
    pattern: "ownername",
    alias: ["owner"],
    desc: "Change owner name",
    category: "settings",
    react: "👑",
    filename: __filename
},
async (conn, mek, m, { from, reply, isCreator, args, prefix, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) {
        return reply(`*📛 ${toStylistUpper('This is an owner command.')}*`);
    }

    if (!args[0]) {
        return reply(`📌 *${toStylistUpper('Usage')}:* ownername <new_name>\n*${toStylistUpper('Current')}:* ${userConfig.OWNER_NAME || config.OWNER_NAME}`);
    }

    const newName = args.join(' ');
    if (newName.length > 30) {
        return reply(`❌ *${toStylistUpper('Owner name must be under 30 characters')}*`);
    }

    userConfig.OWNER_NAME = newName;
    await updateUserConfig(sanitizedNumber, userConfig);
    
    await reply(`✅ *${toStylistUpper('Owner name set to')}* ${newName}`);
});

// ===============================
// OWNER NUMBER COMMAND
// ===============================
cmd({
    pattern: "ownernumber",
    alias: ["ownernum", "ownerphone"],
    desc: "Change owner number",
    category: "settings",
    react: "📞",
    filename: __filename
},
async (conn, mek, m, { from, reply, isCreator, args, prefix, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) {
        return reply(`*📛 ${toStylistUpper('This is an owner command.')}*`);
    }

    if (!args[0]) {
        return reply(`📌 *${toStylistUpper('Usage')}:* ownernumber <new_number>\n*${toStylistUpper('Current')}:* ${userConfig.OWNER_NUMBER || config.OWNER_NUMBER}`);
    }

    const newNumber = args[0];
    if (!newNumber.match(/^\d{10,15}$/)) {
        return reply(`❌ *${toStylistUpper('Please enter a valid phone number (10-15 digits)')}*`);
    }

    userConfig.OWNER_NUMBER = newNumber;
    await updateUserConfig(sanitizedNumber, userConfig);
    
    await reply(`✅ *${toStylistUpper('Owner number set to')}* ${newNumber}`);
});

// ===============================
// DESCRIPTION COMMAND
// ===============================
cmd({
    pattern: "description",
    alias: ["desc", "about"],
    desc: "Change bot description",
    category: "settings",
    react: "📝",
    filename: __filename
},
async (conn, mek, m, { from, reply, isCreator, args, prefix, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) {
        return reply(`*📛 ${toStylistUpper('This is an owner command.')}*`);
    }

    if (!args[0]) {
        return reply(`📌 *${toStylistUpper('Usage')}:* description <new_description>\n*${toStylistUpper('Current')}:* ${userConfig.DESCRIPTION || config.DESCRIPTION}`);
    }

    const newDesc = args.join(' ');
    if (newDesc.length > 200) {
        return reply(`❌ *${toStylistUpper('Description must be under 200 characters')}*`);
    }

    userConfig.DESCRIPTION = newDesc;
    await updateUserConfig(sanitizedNumber, userConfig);
    
    await reply(`✅ *${toStylistUpper('Bot description set to')}* ${newDesc}`);
});

// ===============================
// STICKER NAME COMMAND
// ===============================
cmd({
    pattern: "stickername",
    alias: ["stickertext", "stname"],
    desc: "Set sticker pack name",
    category: "settings",
    react: "🖼️",
    filename: __filename
},
async (conn, mek, m, { from, reply, isCreator, args, prefix, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) {
        return reply(`*📛 ${toStylistUpper('This is an owner command.')}*`);
    }

    if (!args[0]) {
        const currentName = userConfig.STICKER_NAME || 'Sticker Pack';
        return reply(`📌 *${toStylistUpper('Usage')}:* .stickername Your Pack Name\n*${toStylistUpper('Current')}:* ${currentName}`);
    }

    const stickerName = args.join(' ');
    userConfig.STICKER_NAME = stickerName;
    await updateUserConfig(sanitizedNumber, userConfig);
    
    await reply(`✅ *${toStylistUpper('Sticker pack name set to')}* ${stickerName}`);
});

// ===============================
// DELPATH COMMAND
// ===============================
cmd({
    pattern: "delpath",
    alias: ["deletepath", "antideletepath"],
    desc: "Set anti-delete path (same/inbox)",
    category: "settings",
    react: "🗑️",
    filename: __filename
},
async (conn, mek, m, { from, reply, isCreator, args, prefix, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) {
        return reply(`*📛 ${toStylistUpper('This is an owner command.')}*`);
    }

    if (!args[0]) {
        return reply(`📌 *${toStylistUpper('Usage')}:* .delpath same/inbox\n*${toStylistUpper('Current')}:* ${userConfig.ANTI_DELETE_PATH || 'inbox'}`);
    }

    const value = args[0].toLowerCase();
    if (value !== 'same' && value !== 'inbox') {
        return reply(`❌ *${toStylistUpper('Please use: same or inbox')}*`);
    }

    userConfig.ANTI_DELETE_PATH = value;
    await updateUserConfig(sanitizedNumber, userConfig);
    
    await reply(`✅ *${toStylistUpper('Anti-delete path set to')}* ${value}`);
});

// ===============================
// REACT EMOJIS COMMAND
// ===============================
cmd({
    pattern: "reactemojis",
    alias: ["reacts", "reactset"],
    desc: "Set auto react emojis",
    category: "settings",
    react: "😍",
    filename: __filename
},
async (conn, mek, m, { from, reply, isCreator, args, prefix, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) {
        return reply(`*📛 ${toStylistUpper('This is an owner command.')}*`);
    }

    if (!args[0]) {
        const currentEmojis = userConfig.REACT_EMOJIS || ['😍', '❤️', '🔥', '👏', '😮', '😢', '🤣', '👍', '🎉', '🤔', '🙏', '😊', '🥰', '💕', '🤩', '✨', '😎', '🥳', '🙌'];
        return reply(`📌 *${toStylistUpper('Usage')}:* .reactemojis 😍,❤️,🔥,👏,😮\n*${toStylistUpper('Current')}:* ${currentEmojis.join(', ')}`);
    }

    const input = args.join(' ');
    const emojis = input.split(',').map(e => e.trim()).filter(e => e);
    
    if (emojis.length === 0) {
        return reply(`❌ *${toStylistUpper('Please provide valid emojis')}*`);
    }

    userConfig.REACT_EMOJIS = emojis;
    await updateUserConfig(sanitizedNumber, userConfig);
    
    await reply(`✅ *${toStylistUpper('Auto react emojis set')}:*\n${emojis.join(', ')}`);
});

// ===============================
// OWNER EMOJIS COMMAND
// ===============================
cmd({
    pattern: "owneremojis",
    alias: ["owneremojiset", "ownerreacts"],
    desc: "Set owner emojis for reactions",
    category: "settings",
    react: "👑",
    filename: __filename
},
async (conn, mek, m, { from, reply, isCreator, args, prefix, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) {
        return reply(`*📛 ${toStylistUpper('This is an owner command.')}*`);
    }

    if (!args[0]) {
        const currentEmojis = userConfig.OWNER_EMOJIS || ['👑', '⭐', '💎', '🌟', '✨', '⚡', '🔥', '❤️', '💕', '🎯'];
        return reply(`📌 *${toStylistUpper('Usage')}:* .owneremojis 👑,⭐,💎,🌟,✨\n*${toStylistUpper('Current')}:* ${currentEmojis.join(', ')}`);
    }

    const input = args.join(' ');
    const emojis = input.split(',').map(e => e.trim()).filter(e => e);
    
    if (emojis.length === 0) {
        return reply(`❌ *${toStylistUpper('Please provide valid emojis')}*`);
    }

    userConfig.OWNER_EMOJIS = emojis;
    await updateUserConfig(sanitizedNumber, userConfig);
    
    await reply(`✅ *${toStylistUpper('Owner emojis set')}:*\n${emojis.join(', ')}`);
});

// ===============================
// SETTINGS COMMAND
// ===============================
cmd({
    pattern: "settings",
    alias: ["setting", "env", "config"],
    desc: "Bot settings management - View all available setting commands",
    category: "settings",
    react: "⚙️",
    filename: __filename
},
async (conn, mek, m, { from, reply, isCreator, prefix, userConfig }) => {
    if (!isCreator) {
        return reply(`*📛 ${toStylistUpper('This is an owner command.')}*`);
    }
    
    const settingsText = `
╔═════ ⌈ *⚡ ${toStylistUpper(userConfig.BOT_NAME || config.BOT_NAME || 'Bot')} ${toStylistUpper('Settings')}* ⌋ ═════✧
║ 📂 *${toStylistUpper('General Settings')}*
║ • welcome on/off
║ • goodbye on/off
║ • setwelcome <message>
║ • setgoodbye <message>
║
║ 📂 *${toStylistUpper('Anti Features')}*
║ • antiedit on/off
║ • editpath inbox/same
║ • antilink on/off/warn/delete
║ • antidelete on/off
║ • anticall on/off
║ • anticallmsg <message>
║
║ 📂 *${toStylistUpper('Auto Features')}*
║ • autoread on/off
║ • recording on/off
║ • statusview on/off
║ • autoreact on/off
║ • autotyping on/off
║ • online on/off
║
║ 📂 *${toStylistUpper('Control & Sudo')}*
║ • ban @user
║ • unban @user
║ • banlist
║ • sudo @user
║ • delsudo @user
║ • listsudo
║
║ 📂 *${toStylistUpper('Bot Configurations')}*
║ • mode public/private/inbox
║ • prefix <new_prefix>
║ • botname <name>
║ • ownername <name>
║ • ownernumber <number>
║ • description <text>
║ • botdp <url> / reply image
║ • stickername <name>
║ • delpath same/inbox
║ • reactemojis 😍,❤️,🔥
║ • owneremojis 👑,⭐,💎
╚══════════════════════✧

> 💫 _${toStylistUpper('Use .help <command> for more details')}_
    `;
    
    await reply(settingsText.trim());
});
