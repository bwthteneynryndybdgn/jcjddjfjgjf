import { cmd } from '../command.js';

const cleanId = (id) => id ? id.split('@')[0].split(':')[0] : '';

async function checkAdminStatus(conn, chatId, senderId) {
    try {
        const metadata = await conn.groupMetadata(chatId);
        const participants = metadata.participants || [];

        const botId = cleanId(conn.user?.id || '');
        const botLid = cleanId(conn.user?.lid || '');
        const sender = cleanId(senderId);

        let isBotAdmin = false;
        let isSenderAdmin = false;

        for (let p of participants) {
            if (p.admin === "admin" || p.admin === "superadmin") {
                const pId = cleanId(p.id);
                const pLid = cleanId(p.lid);
                const pPhone = p.phoneNumber ? cleanId(p.phoneNumber) : '';

                if (pId === botId || pLid === botLid || pPhone === botId) {
                    isBotAdmin = true;
                }

                if (pId === sender || pLid === sender || pPhone === sender) {
                    isSenderAdmin = true;
                }
            }
        }

        return { isBotAdmin, isSenderAdmin, participants };
    } catch (e) {
        console.error("Admin check error:", e);
        return { isBotAdmin: false, isSenderAdmin: false, participants: [] };
    }
}

// ==================== KICK COMMAND ====================
cmd({
    pattern: "kick",
    alias: ["k"],
    desc: "Kick a member from group",
    category: "group",
    filename: import.meta.url
},
async (conn, mek, m, { reply, react, isBotOwner }) => {
    try {
        const msg = mek || m;
        const from = m.chat || msg.key.remoteJid;

        if (!from.endsWith("@g.us")) {
            return reply("❌ Ye command sirf group ke liye hai.");
        }

        const senderId = msg.key.participant || msg.key.remoteJid;
        const { isBotAdmin, isSenderAdmin, participants } = await checkAdminStatus(conn, from, senderId);

        if (!isSenderAdmin && !isBotOwner) {
            return reply("❌ Sirf group admins members ko kick kar sakte hain.");
        }

        if (!isBotAdmin) {
            return reply("⚠️ Mujhe admin banao pehle, tabhi main kisi ko kick kar sakta hoon.");
        }

        let usersToKick = [];
        const ctxInfo = msg.message?.extendedTextMessage?.contextInfo;
        
        if (ctxInfo?.mentionedJid?.length > 0) {
            usersToKick = ctxInfo.mentionedJid;
        } else if (ctxInfo?.participant) {
            usersToKick = [ctxInfo.participant];
        }

        if (!usersToKick || usersToKick.length === 0) {
            return reply("❌ Kisi member ko mention karo ya uske message ka reply karo.\n\nExample:\n.kick @user");
        }

        const finalKickList = [];
        for (let target of usersToKick) {
            const cleanTarget = cleanId(target);
            const foundUser = participants.find(p => 
                cleanId(p.id) === cleanTarget || 
                cleanId(p.lid) === cleanTarget || 
                (p.phoneNumber && cleanId(p.phoneNumber) === cleanTarget)
            );

            if (foundUser) {
                const realJid = foundUser.id.includes('@') ? foundUser.id : `${cleanId(foundUser.id)}@s.whatsapp.net`;
                finalKickList.push(realJid);
            } else {
                finalKickList.push(target);
            }
        }

        await react("⏳");
        await conn.groupParticipantsUpdate(from, finalKickList, "remove");
        await reply(`✅ Successfully removed @${cleanId(finalKickList[0])}`, { mentions: finalKickList });
        await react("✅");

    } catch (err) {
        console.error("Kick Error:", err);
        await react("❌");
        await reply("❌ Member ko remove karne mein error aaya.");
    }
});

// ==================== KICKALL COMMAND ====================
cmd({
    pattern: "kickall",
    alias: ["end"],
    desc: "Kick all members from group",
    category: "group",
    filename: import.meta.url
},
async (conn, mek, m, { reply, react, isBotOwner }) => {
    try {
        const msg = mek || m;
        const from = m.chat || msg.key.remoteJid;

        if (!from.endsWith("@g.us")) {
            return reply("❌ Ye command sirf group ke liye hai.");
        }

        const senderId = msg.key.participant || msg.key.remoteJid;
        const { isBotAdmin, isSenderAdmin, participants } = await checkAdminStatus(conn, from, senderId);

        if (!isSenderAdmin && !isBotOwner) {
            return reply("❌ Sirf group admins hi ye command use kar sakte hain.");
        }

        if (!isBotAdmin) {
            return reply("⚠️ Mujhe admin banao pehle, tabhi main members ko kick kar sakta hoon.");
        }

        await react("⏳");

        const botId = cleanId(conn.user?.id || '');
        const botLid = cleanId(conn.user?.lid || '');

        const membersToKick = participants
            .filter(p => {
                const pId = cleanId(p.id);
                const pLid = cleanId(p.lid);
                const isSelf = pId === botId || pLid === botLid;
                const isAdmin = p.admin === "admin" || p.admin === "superadmin";
                
                return !isSelf && !isAdmin;
            })
            .map(p => p.id);

        if (membersToKick.length === 0) {
            await react("❌");
            return reply("❌ Group mein remove karne ke liye koi aur member nahi hai.");
        }

        await conn.groupParticipantsUpdate(from, membersToKick, "remove");
        
        await react("✅");
        await reply(`✅ Successfully ${membersToKick.length} members ko group se remove kar diya gaya hai.`);

    } catch (err) {
        console.error("KickAll Error:", err);
        await react("❌");
        await reply("❌ Sabhi members ko remove karne mein error aaya.");
    }
});
