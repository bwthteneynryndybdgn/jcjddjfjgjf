//---------------------------------------------------------------------------
//           KAMRAN-MD - WHATSAPP BAN & STATUS CHECKER PLUGIN
//---------------------------------------------------------------------------

import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import { delay, makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, Browsers } from '@whiskeysockets/baileys';
import pino from 'pino';
import fs from 'fs';
import path from 'path';
import os from 'os';

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

cmd({
    pattern: "bancheck",
    alias: ["bcheck", "checkban"],
    use: '.bancheck <number>',
    desc: "Check if a WhatsApp number is banned or active",
    category: "tools",
    react: "🕵️",
    filename: __filename
}, async (conn, mek, m, { from, text, reply }) => {
    try {
        if (!text) {
            let helpMsg = `❖ ── ✦ *${toStylistUpper('WhatsApp Ban Checker')}* ✦ ── ❖\n\n`;
            helpMsg += `╔═════ ⌈ *⚡ ${toStylistUpper('Usage Guide')}* ⌋ ═════✧\n`;
            helpMsg += `║ 📌 *${toStylistUpper('Example')}:*\n`;
            helpMsg += `║ • .bancheck 923103448168\n`;
            helpMsg += `╚══════════════════════✧\n\n`;
            helpMsg += `> 💫 _${toStylistUpper('Powered by Kamran-Md')}_`;
            return reply(helpMsg);
        }

        const cleanNumber = text.replace(/[^0-9]/g, '');
        if (cleanNumber.length < 10 || cleanNumber.length > 15) {
            return reply(`❌ *${toStylistUpper('Invalid number format. Include country code.')}*`);
        }

        await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });
        const masked = cleanNumber.slice(0, 5) + '****' + cleanNumber.slice(-3);
        
        let status = "UNKNOWN";
        let details = "";
        let sessionPath = "";
        let tempConn = null;

        try {
            // 1. Temporary session path banate hain
            sessionPath = path.join(os.tmpdir(), `bancheck_${cleanNumber}_${Date.now()}`);
            fs.mkdirSync(sessionPath, { recursive: true });

            const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
            const { version } = await fetchLatestBaileysVersion();
            const logger = pino({ level: 'silent' });

            // 2. Temporary socket banate hain
            tempConn = makeWASocket({
                auth: { creds: state.creds, keys: state.keys },
                printQRInTerminal: false,
                logger,
                version,
                browser: Browsers.macOS('Safari'),
                syncFullHistory: false,
                connectTimeoutMs: 15000,
                defaultQueryTimeoutMs: 15000
            });

            // Socket connection establish hone ke liye thoda wait dena zaroori hai
            await delay(3000);

            // 3. Pairing Code Request bhejte hain
            let pairSuccess = false;
            let errorMessage = "";

            try {
                const code = await tempConn.requestPairingCode(cleanNumber, 'KAMRANMD');
                if (code) pairSuccess = true;
            } catch (err) {
                errorMessage = err.message || "Unknown error";
                if (err.output?.statusCode) {
                    errorMessage += ` (Status: ${err.output.statusCode})`;
                }
            }

            // 4. Result Evaluate karte hain
            if (pairSuccess) {
                status = "✅ ACTIVE / NOT BANNED";
                details = "Number is active. WhatsApp accepted the pairing request.";
            } else {
                const errStr = errorMessage.toLowerCase();
                
                if (errStr.includes('connection closed') || errStr.includes('401') || errStr.includes('403') || errStr.includes('404')) {
                    status = "❌ BANNED / INVALID";
                    details = "WhatsApp rejected the request. Number might be *banned*, *fake*, or doesn't exist.";
                } else if (errStr.includes('429') || errStr.includes('rate limit') || errStr.includes('too many')) {
                    status = "⚠️ RATE LIMITED";
                    details = "WhatsApp temporarily blocked requests for this number. Try again later.";
                } else {
                    status = "❌ FAILED";
                    details = `WhatsApp rejected the pairing request.\n*Reason:* ${errorMessage}`;
                }
            }

        } catch (err) {
            console.error("Bancheck Inner Error:", err);
            status = "❌ ERROR";
            details = "Failed to initiate socket connection.";
        } finally {
            // 5. Cleanup: Temporary session safely delete karo
            try {
                if (tempConn) tempConn.end(new Error('Done'));
                if (sessionPath && fs.existsSync(sessionPath)) {
                    fs.rmSync(sessionPath, { recursive: true, force: true });
                }
            } catch (e) {}
        }

        await conn.sendMessage(from, { react: { text: status.includes('✅') ? '✅' : '❌', key: m.key } });

        let resText = `❖ ── ✦ *${toStylistUpper('WhatsApp Ban Checker')}* ✦ ── ❖\n\n`;
        resText += `📱 *${toStylistUpper('Number')}:* \`${masked}\`\n`;
        resText += `📊 *${toStylistUpper('Status')}:* ${status}\n\n`;
        resText += `📝 *${toStylistUpper('Details')}:*\n${details}\n\n`;
        resText += `> 💫 _${toStylistUpper('Powered by Kamran-Md')}_`;

        await reply(resText);

    } catch (error) {
        console.error("BANCHECK ERROR:", error);
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
        reply(`❌ *${toStylistUpper('Failed to check the number. Please try again later.')}*`);
    }
});
