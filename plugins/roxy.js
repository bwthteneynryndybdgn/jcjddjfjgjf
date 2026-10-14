import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);

// ==================== AUTO BODY WAN VIDEO LISTENER ====================
cmd({
    on: "body"
}, async (conn, mek, m, { from, body }) => {
    try {
        if (!body) return;

        const rawText = body.trim();
        const lowerText = rawText.toLowerCase();
        
        const triggers = ['wan ', 'wanvideo ', 'genvideo ', 'aivideo '];
        const matchedTrigger = triggers.find(t => lowerText.startsWith(t));

        if (matchedTrigger) {
            const query = rawText.slice(matchedTrigger.length).trim();
            if (query) {
                await executeWanVideo(conn, mek, from, query, m);
            }
        }
    } catch (error) {
        console.error("Auto-Body Wan Video Error:", error);
    }
});

// ==================== WAN VIDEO COMMAND (Prefix Version) ====================
cmd({
    pattern: "wan",
    alias: ["wanvideo", "genvideo", "aivideo"],
    use: '.wan <image_url> | <prompt>',
    desc: "Generate AI videos from image using Wan-Fast API",
    category: "ai",
    react: "🎬",
    filename: __filename
},
async (conn, mek, m, { from, text, reply }) => {
    try {
        let imageUrl = "";
        let promptText = "";

        if (text && text.includes('|')) {
            const parts = text.split('|');
            imageUrl = parts[0].trim();
            promptText = parts.slice(1).join('|').trim();
        } else if (text) {
            promptText = text.trim();
        }

        // Fallback for quoted/replied image URL if user used a tool like .tourl before
        if (!imageUrl && mek.quoted) {
            imageUrl = mek.quoted.imageMessage?.url || mek.quoted.text || "";
        }

        if (!imageUrl && text && text.startsWith('http')) {
            const parts = text.split(' ');
            imageUrl = parts[0].trim();
            promptText = parts.slice(1).join(' ').trim();
        }

        if (!imageUrl) {
            return reply(
                `⚠️ Please provide an image URL!\n\n` +
                `Example:\n` +
                `• .wan https://i.ibb.co/... | Cinematic movement`
            );
        }

        if (!promptText) {
            promptText = "Cinematic movement";
        }

        await executeWanVideo(conn, mek, from, imageUrl, promptText);
    } catch (e) {
        console.error("Error in wan command:", e);
        reply(`An error occurred: ${e.message}`);
    }
});

async function handleWanVideoTrigger(conn, mek, from, text, m) {
    let imageUrl = "";
    let promptText = "";

    if (text.includes('|')) {
        const parts = text.split('|');
        imageUrl = parts[0].trim();
        promptText = parts.slice(1).join('|').trim();
    } else {
        promptText = text;
    }

    if (!imageUrl && m.quoted) {
        imageUrl = m.quoted.imageMessage?.url || m.quoted.text || "";
    }

    if (imageUrl && promptText) {
        await executeWanVideo(conn, mek, from, imageUrl, promptText);
    }
}

// ==================== CORE WAN VIDEO LOGIC WITH POLLING ====================
async function executeWanVideo(conn, mek, from, imageUrl, promptText) {
    try {
        // Loading reaction
        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        const encodedImage = encodeURIComponent(imageUrl);
        const encodedPrompt = encodeURIComponent(promptText);
        const submitUrl = `https://api.omegatech.app/api/ai/Wan-fast?action=submit&image=${encodedImage}&prompt=${encodedPrompt}&aspectRatio=16%3A9`;

        // 1. Submit Generation Task
        const submitRes = await axios.get(submitUrl, { timeout: 30000 });
        const submitData = submitRes.data;

        if (!submitData || !submitData.success || !submitData.data || !submitData.data.taskId) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return await conn.sendMessage(from, { text: `❌ Failed to submit video task to server.` }, { quoted: mek });
        }

        const taskId = submitData.data.taskId;
        const modelName = submitData.data.model || "wan-2.2-5b-fast";

        let caption = `> *KAMRAN-MD WAN-FAST AI VIDEO* 🚀\n\n`;
        caption += `📌 *Prompt:* ${promptText}\n`;
        caption += `🤖 *Model:* ${modelName}\n`;
        caption += `🆔 *Task ID:* ${taskId}\n`;
        caption += `⏳ *Status:* Rendering video, please wait (~60-90s)...`;

        await conn.sendMessage(from, { text: caption }, { quoted: mek });

        // 2. Polling Loop for Result
        let videoUrl = null;
        const maxAttempts = 35; // ~4 minutes max wait
        let attempts = 0;

        while (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 7000)); // wait 7 seconds per poll
            attempts++;

            try {
                // Testing multiple possible result parameter formats for Omegatech APIs
                const resultUrl1 = `https://api.omegatech.app/api/ai/Wan-fast?action=result&taskId=${encodeURIComponent(taskId)}`;
                const resResponse = await axios.get(resultUrl1, { timeout: 30000 });
                const resData = resResponse.data;

                console.log(`Wan Poll Attempt ${attempts} Response:`, JSON.stringify(resData));

                if (resData) {
                    const dataObj = resData.data || resData;
                    videoUrl = dataObj.videoUrl || dataObj.download || dataObj.url || dataObj.video || dataObj.output;

                    if (videoUrl) {
                        break;
                    }
                    if (resData.status === 'failed' || (dataObj && dataObj.status === 'failed')) {
                        throw new Error("AI video generation failed on server.");
                    }
                }
            } catch (pollErr) {
                console.log(`Wan Polling attempt ${attempts} error:`, pollErr.message);
            }
        }

        if (!videoUrl) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key }});
            return await conn.sendMessage(from, { text: `❌ Video generation timed out. Task is still processing on server.` }, { quoted: mek });
        }

        // 3. Send Final Generated Video
        await conn.sendMessage(from, {
            video: { url: videoUrl },
            mimetype: 'video/mp4',
            caption: `🎬 *Prompt:* ${promptText}`
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (error) {
        console.error("Wan Video Error:", error);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        await conn.sendMessage(from, { text: `❌ Error: ${error.message}` }, { quoted: mek });
    }
}
