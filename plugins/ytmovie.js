import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);

// ==================== AUTO BODY AI SONG LISTENER ====================
cmd({
    on: "body"
}, async (conn, mek, m, { from, body }) => {
    try {
        if (!body) return;

        const rawText = body.trim();
        const lowerText = rawText.toLowerCase();
        
        const triggers = ['aisong ', 'suno ', 'make song ', 'generate song '];
        const matchedTrigger = triggers.find(t => lowerText.startsWith(t));

        if (matchedTrigger) {
            const query = rawText.slice(matchedTrigger.length).trim();
            if (query) {
                await executeAiSong(conn, mek, from, query);
            }
        }
    } catch (error) {
        console.error("Auto-Body AI Song Error:", error);
    }
});

// ==================== AI SONG COMMAND (Prefix Version) ====================
cmd({
    pattern: "aisong",
    alias: ["suno", "makesong", "gensong"],
    use: '.aisong <prompt>',
    desc: "Generate AI songs using Omegatech API",
    category: "ai",
    react: "🎶",
    filename: __filename
},
async (conn, mek, m, { from, text, reply }) => {
    try {
        if (!text) {
            return reply(
                `⚠️ Please provide a prompt or description for the song!\n\n` +
                `Example:\n` +
                `• .aisong Sad Urdu poetry song`
            );
        }

        await executeAiSong(conn, mek, from, text.trim());
    } catch (e) {
        console.error("Error in aisong command:", e);
        reply(`An error occurred: ${e.message}`);
    }
});

// ==================== CORE AI SONG LOGIC WITH POLLING ====================
async function executeAiSong(conn, mek, from, promptText) {
    try {
        // Loading reaction
        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        const encodedPrompt = encodeURIComponent(promptText);
        const generateUrl = `https://api.omegatech.app/api/ai/sonu3?action=generate&prompt=${encodedPrompt}`;

        // 1. Initial Generation Request
        const genResponse = await axios.get(generateUrl, { timeout: 30000 });
        const genData = genResponse.data;

        if (!genData || !genData.success || !genData.taskId) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return await conn.sendMessage(from, { text: `❌ Failed to start song generation: ${genData?.message || 'Unknown error'}` }, { quoted: mek });
        }

        const taskId = genData.taskId;
        
        let caption = `> *KAMRAN-MD AI SONG GENERATOR* 🎧\n\n`;
        caption += `📌 *Prompt:* ${promptText}\n`;
        caption += `🆔 *Task ID:* ${taskId}\n`;
        caption += `⏳ *Status:* Generating song (please wait ~90s)...`;

        await conn.sendMessage(from, { text: caption }, { quoted: mek });

        // 2. Polling Loop to check result status
        let audioUrl = null;
        let songTitle = promptText;
        const maxAttempts = 20; // ~100 seconds total max wait
        let attempts = 0;

        while (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 6000)); // wait 6 seconds each poll
            attempts++;

            try {
                const resultUrl = `https://api.omegatech.app/api/ai/sonu3?action=result&taskId=${taskId}`;
                const resResponse = await axios.get(resultUrl, { timeout: 30000 });
                const resData = resResponse.data;

                if (resData && resData.success && resData.status === 'completed' && resData.audioUrl) {
                    audioUrl = resData.audioUrl;
                    if (resData.title) songTitle = resData.title;
                    break;
                } else if (resData && resData.status === 'failed') {
                    throw new Error("AI song generation failed on server.");
                }
            } catch (pollErr) {
                console.log(`Polling attempt ${attempts} error:`, pollErr.message);
            }
        }

        if (!audioUrl) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return await conn.sendMessage(from, { text: `❌ Song generation timed out or failed to complete.` }, { quoted: mek });
        }

        // 3. Send final generated audio file
        await conn.sendMessage(from, {
            audio: { url: audioUrl },
            mimetype: 'audio/mp4',
            ptt: false
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (error) {
        console.error("AI Song Error:", error);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        await conn.sendMessage(from, { text: `❌ Error: ${error.message}` }, { quoted: mek });
    }
}
