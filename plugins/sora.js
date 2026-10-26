import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "sora",
    alias: ["sora2", "txt2video", "aiovideo"],
    use: '.sora <aap ka prompt>',
    desc: "Generate AI videos using Omegatech Txt2video API",
    category: "ai",
    react: "🎬",
    filename: __filename
},
async (conn, mek, m, { from, text, usedPrefix, command, reply }) => {
    const query = String(text || "").trim();
    if (!query) {
        return reply(`*🎬 KAMRAN-MD AI Video*\n\nExample:\n• .${command} Cat food\n• .${command} a cute cat walking in the rain`);
    }

    await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });
    await reply('🎬 *KAMRAN-MD* is generating video… please wait.');

    try {
        const apiUrl = `https://api.omegatech.app/api/ai/Txt2video?action=generate&prompt=${encodeURIComponent(query)}&ratio=auto&sound=true`;
        
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Check if videoUrl is present in response data
        const videoUrl = data?.data?.videoUrl || data?.videoUrl || data?.result;

        if (data.success && videoUrl) {
            await conn.sendMessage(from, { 
                video: { url: videoUrl }, 
                caption: `🎬 *KAMRAN-MD AI Video*\n📝 *Prompt:* ${query}\n🔗 *By:* ${data.attribution || '@Omegatech'}` 
            }, { quoted: mek });
            
            return await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
        } else {
            throw new Error("API se video URL hasil nahi hua.");
        }

    } catch (e) {
        console.error('[SORA ERROR]', e);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        return reply(`❌ Error: ${e.message}`);
    }
});
