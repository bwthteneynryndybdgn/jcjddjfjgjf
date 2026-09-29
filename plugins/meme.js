import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "waifu2",
    alias: ["randomwaifu", "animegirl"],
    desc: "Get a random anime waifu image via FAA API",
    category: "anime",
    react: "🌸",
    filename: __filename
}, async (conn, mek, m, { from, reply }) => {
    try {
        // Loading reaction
        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        const apiUrl = `https://api-faa.my.id/faa/waifu`;
        
        // Agar API binary image bhej rahi hai, toh responseType 'arraybuffer' ya 'json' manage karna hoga
        const response = await axios.get(apiUrl, { 
            responseType: 'json',
            validateStatus: false 
        });

        const resData = response.data;

        // Check karein ki kya data ek valid URL string hai ya nahi
        let imageUrl = '';
        if (typeof resData === 'string' && resData.startsWith('http')) {
            imageUrl = resData;
        } else if (resData && resData.url) {
            imageUrl = resData.url;
        } else if (resData && resData.result) {
            imageUrl = resData.result;
        }

        // Agar API direct image buffer/binary bhej rahi hai, toh usko direct buffer se send karenge
        if (!imageUrl) {
            // Fallback: Agar direct image bytes aa gaye hain toh use buffer bna kar bhej do
            const imageBufferResponse = await axios.get(apiUrl, { responseType: 'arraybuffer' });
            
            await conn.sendMessage(from, { 
                image: imageBufferResponse.data, 
                caption: `✨ *Random Waifu*` 
            }, { quoted: mek });
        } else {
            // Agar URL mil gaya hai toh URL se send karein
            await conn.sendMessage(from, { 
                image: { url: imageUrl }, 
                caption: `✨ *Random Waifu*` 
            }, { quoted: mek });
        }

        // Success reaction
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (error) {
        console.error("Waifu Error:", error);
        reply(`❌ Error: ${error.message}`);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
    }
});
