import { fileURLToPath } from 'url';
import axios from 'axios';
import googleTTS from 'google-tts-api';
import { cmd, commands } from '../command.js';

cmd({
    pattern: "tts",
    desc: "Convert text to audio speech in Urdu.",
    category: "download",
    react: "🗣️",
    filename: fileURLToPath(import.meta.url)
},
async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q || typeof q !== 'string' || !q.trim()) {
            return reply("❌ Baraye meharbani kuch text likhein jisko bolna hai!");
        }

        // Generate Google TTS Audio URL (Urdu Language)
        const url = googleTTS.getAudioUrl(q.trim(), {
            lang: 'ur',
            slow: false,
            host: 'https://translate.google.com',
        });

        // Send audio file back to chat
        await conn.sendMessage(from, { 
            audio: { url: url }, 
            mimetype: 'audio/mpeg', 
            ptt: false 
        }, { quoted: mek });

    } catch (error) {
        console.error("TTS Command Error:", error);
        return reply(`❌ *TTS System Fail:* ${error.message}`);
    }
});
