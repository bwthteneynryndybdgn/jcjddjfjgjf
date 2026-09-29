import { fileURLToPath } from 'url';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);

let antiMediaGroups = new Set();
let antiMediaWarns = {};

// ==================== ANTI-MEDIA COMMAND ====================
cmd({
    pattern: "antimedia",
    alias: ["anti-media", "nomedia", "am"],
    desc: "Enable/Disable Anti-Media with 3 warning system",
    category: "group",
    react: "🚫",
    filename: __filename
}, async (conn, mek, m, { from, isCreator, isBotAdmins, isAdmins, isGroup, reply }) => {
    try {
        if (!isGroup) return await reply("⚠️ This command only works in groups.");
        if (!isBotAdmins) return await reply("❌ I must be admin to delete media.");
        if (!isCreator &&!isAdmins) return await reply("🔐 Only bot owner or group admins can use this command.");

        if (antiMediaGroups.has(from)) {
            antiMediaGroups.delete(from);
            delete antiMediaWarns[from];
            return await reply(`✅ *Anti-Media OFF*\n\nAb group me media allowed hai.`);
        } else {
            antiMediaGroups.add(from);
            if(!antiMediaWarns[from]) antiMediaWarns[from] = {};
            return await reply(`🚫 *Anti-Media ON*\n\n*Rule:*\n1️⃣ 1st Media = Warning 1/3\n2️⃣ 2nd Media = Warning 2/3\n3️⃣ 3rd Media = Kick`);
        }

    } catch (err) {
        console.error(err);
        await reply("❌ Failed to toggle anti-media.");
    }
});

// ==================== ANTI-MEDIA HANDLER ====================
export default async function antiMediaHandler(conn, m) {
    try {
        if (!m.isGroup) return;
        if (!antiMediaGroups.has(m.chat)) return;

        const messageType = Object.keys(m.message || {})[0];
        const mediaTypes = ["imageMessage", "videoMessage", "audioMessage", "pttMessage", "documentMessage", "stickerMessage"];

        if (!mediaTypes.includes(messageType)) return;

        const groupId = m.chat;
        const userId = m.key.participant;
        const senderNum = userId.split('@')[0];

        const self = conn.user.id.split(":")[0] + '@s.whatsapp.net';
        if(userId === self) return;

        // Admin skip
        const metadata = await conn.groupMetadata(groupId);
        const admins = metadata.participants.filter(p => p.admin).map(p => p.id);
        if(admins.includes(userId)) return;

        // Warning count
        if(!antiMediaWarns[groupId]) antiMediaWarns[groupId] = {};
        antiMediaWarns[groupId][senderNum] = (antiMediaWarns[groupId][senderNum] || 0) + 1;
        const warns = antiMediaWarns[groupId][senderNum];

        // Delete media
        await conn.sendMessage(groupId, { delete: m.key });

        if (warns === 1) {
            await conn.sendMessage(groupId, {
                text: `⚠️ *WARNING 1/3* @${senderNum}\n\n🚫 Group me Media bhejna mana hai!`,
                mentions: [userId]
            });
        }
        else if (warns === 2) {
            await conn.sendMessage(groupId, {
                text: `⚠️ *WARNING 2/3* @${senderNum}\n\n🚫 Last Warning! Agli baar Kick ho jaoge`,
                mentions: [userId]
            });
        }
        else if (warns >= 3) {
            await conn.sendMessage(groupId, {
                text: `*💀 Successfully removed from group.*\n\n📌 Reason: 3 Baar Media bheja\n👤 User: @${senderNum}`,
                mentions: [userId]
            });
            await conn.groupParticipantsUpdate(groupId, [userId], "remove");
            delete antiMediaWarns[groupId][senderNum];
        }

    } catch (err) {
        console.error("AntiMedia Error:", err);
    }
}
