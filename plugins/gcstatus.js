import { cmd } from '../command.js';
import { fileURLToPath } from 'url';
import { downloadContentFromMessage } from '@whiskeysockets/baileys';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "gcstatus",
    alias: ["gstatus", "groupstatus"],
    desc: "Send status with mentions to current group or all groups.",
    category: "group",
    react: "📡",
    filename: __filename
}, async (conn, mek, m, { from, text, reply, isCreator }) => {

    // ── Owner Check ──
    if (!isCreator) return reply("❌ This command is only for the *bot owner*!");

    try {
        const args = text?.trim().split(" ") || [];
        const isAll = args[0]?.toLowerCase() === "all";
        const caption = isAll ? args.slice(1).join(" ") : text?.trim() || "";
        
        const quotedMsg = m.quoted || m.msg?.contextInfo?.quotedMessage;
        
        let mimeType = "";
        if (quotedMsg) {
            const typeKey = Object.keys(quotedMsg)[0] || '';
            const content = quotedMsg[typeKey];
            mimeType = content?.mimetype || (m.quoted ? (m.quoted.msg || m.quoted).mimetype : "") || "";
        }

        if (!quotedMsg && !caption && !isAll) {
            return reply(
                `📡 *GC Status Usage:*\n\n` +
                `*Single GC:* \`.gcstatus Hello\`\n` +
                `*All GCs:* \`.gcstatus all Hello\`\n\n` +
                `━━━━━━━━━━━━━━━━━━\n` +
                `~ *KAMRAN-MD*`
            );
        }

        // ── Download Media Buffer ──
        let mediaBuffer = null;
        if (quotedMsg) {
            try {
                if (m.quoted && typeof m.quoted.download === 'function') {
                    mediaBuffer = await m.quoted.download();
                } else {
                    const typeKey = Object.keys(quotedMsg)[0] || '';
                    const content = quotedMsg[typeKey];
                    let mediaType = typeKey.replace('Message', '').toLowerCase();
                    if (mediaType.includes('image')) mediaType = 'image';
                    else if (mediaType.includes('video')) mediaType = 'video';
                    else if (mediaType.includes('audio')) mediaType = 'audio';

                    const stream = await downloadContentFromMessage(content, mediaType);
                    let chunks = [];
                    for await (const chunk of stream) {
                        chunks.push(chunk);
                    }
                    mediaBuffer = Buffer.concat(chunks);
                }
            } catch (err) {
                console.error("GCStatus media download error:", err);
            }
        }

        const getMsgType = () => {
            if (mimeType.includes("image") || quotedMsg?.imageMessage) return "image";
            if (mimeType.includes("video") || quotedMsg?.videoMessage) return "video";
            if (mimeType.includes("audio") || quotedMsg?.audioMessage) return "audio";
            return null;
        };

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        // ── LOOP 1: Single Group Logic ──────────────────────────────────
        if (!isAll) {
            const groupMetadata = await conn.groupMetadata(from);
            const mentionedJid = (groupMetadata.participants || []).map(p => p.id);
            const contextInfo = { mentionedJid, isGroupStatus: true };

            let messageContent = {};
            if (mediaBuffer) {
                const type = getMsgType();
                if (type === "image") messageContent = { image: mediaBuffer, caption, contextInfo };
                else if (type === "video") messageContent = { video: mediaBuffer, caption, contextInfo };
                else if (type === "audio") messageContent = { audio: mediaBuffer, mimetype: mimeType, ptt: mimeType.includes("ogg"), contextInfo };
                else messageContent = { image: mediaBuffer, caption, contextInfo };
            } else {
                messageContent = { text: caption, contextInfo };
            }

            await conn.sendMessage(from, messageContent);
            await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
            return reply("✅ *Status sent to this group successfully!*");
        }

        // ── LOOP 2: All Groups (Broadcast) Logic ────────────────────────
        if (isAll) {
            const allChats = await conn.groupFetchAllParticipating();
            const allGroups = Object.values(allChats);
            let successCount = 0;

            for (const group of allGroups) {
                try {
                    const mentionedJid = (group.participants || []).map(p => p.id);
                    const contextInfo = { mentionedJid, isGroupStatus: true };

                    let messageContent = {};
                    if (mediaBuffer) {
                        const type = getMsgType();
                        if (type === "image") messageContent = { image: mediaBuffer, caption, contextInfo };
                        else if (type === "video") messageContent = { video: mediaBuffer, caption, contextInfo };
                        else if (type === "audio") messageContent = { audio: mediaBuffer, mimetype: mimeType, ptt: mimeType.includes("ogg"), contextInfo };
                        else messageContent = { image: mediaBuffer, caption, contextInfo };
                    } else {
                        messageContent = { text: caption, contextInfo };
                    }

                    await conn.sendMessage(group.id, messageContent);
                    successCount++;
                    
                    await new Promise(r => setTimeout(r, 1000)); 
                } catch (err) {
                    console.error(`Failed for ${group.id}:`, err.message);
                }
            }

            await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
            return reply(`✅ *Broadcast Finished!*\n\n*Sent to:* ${successCount} groups.\n━━━━━━━━━━━━━━━━━━\n~ *KAMRAN-MD*`);
        }

    } catch (error) {
        console.error("GCStatus Error:", error);
        reply(`❌ *Error:* ${error.message}`);
    }
});
