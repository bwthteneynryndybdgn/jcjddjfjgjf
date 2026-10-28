import { cmd } from '../command.js';
import { fileURLToPath } from 'url';
import { delay, makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, Browsers } from '@whiskeysockets/baileys';
import pino from 'pino';
import fs from 'fs';
import path from 'path';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "bancheck",
    alias: ["bcheck", "checkban"],
    desc: "Check if a number is banned/fake via Pairing Request",
    category: "tools",
    react: "🕵️",
    filename: __filename
}, async (conn, mek, m, { from, text, reply }) => {
    try {
        if (!text) {
            return reply("❌ Please provide a WhatsApp number.\n\n*Example:* `.bancheck 923103448168`");
        }

        const cleanNumber = text.replace(/[^0-9]/g, '');
        if (cleanNumber.length < 10 || cleanNumber.length > 15) {
            return reply("❌ Invalid number format. Include country code.");
        }

        await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });
        const masked = cleanNumber.slice(0, 5) + '****' + cleanNumber.slice(-3);
        
        let status = "UNKNOWN";
        let details = "";

        try {
            // 1. Temporary session path banate hain
            const sessionPath = path.join(os.tmpdir(), `bancheck_${cleanNumber}_${Date.now()}`);
            fs.mkdirSync(sessionPath, { recursive: true });

            const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
            const { version } = await fetchLatestBaileysVersion();
            const logger = pino({ level: 'silent' });

            // 2. Temporary socket banate hain (Sirf check ke liye)
            const tempConn = makeWASocket({
                auth: { creds: state.creds, keys: state.keys },
                printQRInTerminal: false,
                logger,
                version,
                browser: Browsers.macOS('Safari'),
                syncFullHistory: false,
                connectTimeoutMs: 15000,
                defaultQueryTimeoutMs: 15000
            });

            // 3. Pairing Code Request bhejte hain (Ye check karega)
            let pairSuccess = false;
            let errorMessage = "";

            try {
                // Agar WhatsApp ne number block kiya hoga, to yahan error aayega
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
                details = "Number is active. WhatsApp accepted the pairing request and sent a code.";
            } else {
                // Error codes analyse karo
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

            // 5. Cleanup: Temporary session delete karo
            try {
                tempConn.end(new Error('Done'));
                fs.rmSync(sessionPath, { recursive: true, force: true });
            } catch (e) {}

        } catch (err) {
            console.error("Bancheck Inner Error:", err);
            status = "❌ ERROR";
            details = "Failed to initiate socket connection.";
        }

        await conn.sendMessage(from, { react: { text: status.includes('✅') ? '✅' : '❌', key: m.key } });

        const resText = `*🕵️ WHATSAPP BAN CHECK*\n\n` +
                        `📱 *Number:* ${masked}\n` +
                        `📊 *Status:* ${status}\n\n` +
                        `📝 *Details:*\n${details}\n\n` +
                        `> Powered by JAWAD-MD`;

        await reply(resText);

    } catch (error) {
        console.error("BANCHECK ERROR:", error);
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
        reply("❌ Failed to check the number. Please try again later.");
    }
});
