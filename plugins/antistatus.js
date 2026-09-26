// plugins/anti-status.js - Kick Mode Only
import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import config from '../config.js';

const __filename = fileURLToPath(import.meta.url);

// ===============================
// ANTI-STATUS - KICK ONLY MODE
// ===============================

cmd({
    on: "body"
}, async (conn, m, store, { isGroup, botNumber2, userConfig, isCreator, isAdmins, isBotAdmins }) => {
    try {
        const mek = m.mek || m;
        if (mek.key?.fromMe) return;

        // Check if anti-status is enabled
        const ANTI_STATUS = userConfig?.ANTI_STATUS || config.ANTI_STATUS || 'false';
        if (ANTI_STATUS !== 'true' || !isGroup || !botNumber2) return;

        const message = m.message || {};
        const hasStatusMention = message.groupStatusMentionMessage ? true : false;

        if (!hasStatusMention) return;

        const chatId = m.chat;
        const sender = m.sender;

        // ✅ CHECK: If sender is Creator → Skip (Owner)
        if (isCreator) return;

        // ✅ CHECK: If sender is Group Admin → Skip
        if (isAdmins) return;

        // ✅ CHECK: If Bot is not Admin → SILENTLY SKIP (no notice)
        if (!isBotAdmins) return;

        // ✅ DELETE THE STATUS MENTION MESSAGE
        try {
            await conn.sendMessage(chatId, { delete: mek.key });
        } catch (_) {}

        // ✅ KICK THE USER
        try {
            await conn.groupParticipantsUpdate(chatId, [sender], 'remove');
        } catch (_) {}

        // ✅ Send kick notification (optional - you can remove this too)
        try {
            await conn.sendMessage(chatId, {
                text: `🚫 @${sender.split('@')[0]} has been removed for sending a status mention!`,
                mentions: [sender]
            });
        } catch (_) {}

    } catch (e) {
        // SILENT FAIL - no logs
    }
});

// ===============================
// ANTI-STATUS COMMAND TO TOGGLE
// ===============================

cmd({
    pattern: 'antistatus',
    alias: ['antistatus', 'anti-status', 'astatus'],
    desc: 'Toggle anti-status mention protection (KICK MODE)',
    category: 'group',
    react: '🛡️',
    usage: '.antistatus on/off'
}, async (conn, mek, m, { from, reply, sender, isCreator, userConfig, updateUserConfig, sanitizedNumber }) => {
    try {
        if (!isCreator) {
            await reply('❌ *Only owner can use this command!*');
            return;
        }

        const args = m.args || [];
        const action = args[0]?.toLowerCase();

        if (!action || (action !== 'on' && action !== 'off')) {
            await reply(`🛡️ *ANTI-STATUS SETTINGS (KICK MODE)*\n\n` +
                       `Current status: ${userConfig?.ANTI_STATUS === 'true' ? '✅ ON' : '❌ OFF'}\n\n` +
                       `📌 When enabled:\n` +
                       `▸ Status mentions = INSTANT KICK\n` +
                       `▸ No warnings\n` +
                       `▸ No second chances\n\n` +
                       `👥 Exemptions:\n` +
                       `▸ Creator/Owner\n` +
                       `▸ Group Admins\n\n` +
                       `Usage:\n` +
                       `▸ .antistatus on  - Enable\n` +
                       `▸ .antistatus off - Disable`);
            return;
        }

        const newStatus = action === 'on' ? 'true' : 'false';

        // Update config
        await updateUserConfig(sanitizedNumber, { ANTI_STATUS: newStatus });

        await reply(`🛡️ *ANTI-STATUS ${newStatus === 'true' ? 'ENABLED' : 'DISABLED'}!*\n\n` +
                   `✅ Status mention protection is now ${newStatus === 'true' ? 'ACTIVE' : 'INACTIVE'}.\n\n` +
                   `📌 Mode: KICK ON SIGHT\n` +
                   `▸ No warnings\n` +
                   `▸ Instant removal`);

    } catch (e) {
        console.error('❌ Anti-status command error:', e.message);
        await reply(`❌ Error: ${e.message}`);
    }
});
