// plugins/random.js - ESM Version
import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import config from '../config.js';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);

// Helper function to handle binary/buffer image API requests
const handleRandomApi = async (client, message, from, apiUrl, title, userConfig) => {
    try {
        const DESCRIPTION = userConfig?.DESCRIPTION || config.DESCRIPTION || "Powered by Bot";

        await client.sendMessage(from, { react: { text: '⏳', key: message.key } });

        // responseType 'arraybuffer' set karna zaroori hai kyunki API direct image bytes bhej rahi hai
        const response = await axios.get(apiUrl, { 
            responseType: 'arraybuffer',
            timeout: 30000 
        });

        const imageBuffer = Buffer.from(response.data);

        if (!imageBuffer || imageBuffer.length === 0) {
            return await client.sendMessage(from, {
                text: "❌ *Image buffer empty hai!* Data fetch nahi ho saka."
            }, { quoted: message });
        }

        let caption = `*✨ ${title.toUpperCase()}* ✨\n\n> ${DESCRIPTION}`;

        // Buffer ko direct image object me pass karenge
        await client.sendMessage(from, {
            image: imageBuffer,
            caption: caption
        }, { quoted: message });

        await client.sendMessage(from, { react: { text: '✅', key: message.key } });

    } catch (error) {
        console.error(`${title} Error:`, error);
        await client.sendMessage(from, {
            text: "❌ Error fetching image:\n" + (error?.message || error)
        }, { quoted: message });
    }
};

// 1. Cecan Indo
cmd({
    pattern: "indo",
    alias: ["cecanindo"],
    react: '📸',
    desc: "Get random Indo Cecan image",
    category: "random",
    filename: __filename
}, async (client, message, m, { from, userConfig }) => {
    await handleRandomApi(client, message, from, "https://techxkamran.onrender.com/api/random/cecan_indo", "Indo Cecan", userConfig);
});

// 2. Cecan Thailand
cmd({
    pattern: "thailand",
    alias: ["cecanthailand", "thai"],
    react: '📸',
    desc: "Get random Thailand Cecan image",
    category: "random",
    filename: __filename
}, async (client, message, m, { from, userConfig }) => {
    await handleRandomApi(client, message, from, "https://techxkamran.onrender.com/api/random/cecan_thailand", "Thailand Cecan", userConfig);
});

// 3. Cecan China
cmd({
    pattern: "china",
    alias: ["cecanchina"],
    react: '📸',
    desc: "Get random China Cecan image",
    category: "random",
    filename: __filename
}, async (client, message, m, { from, userConfig }) => {
    await handleRandomApi(client, message, from, "https://techxkamran.onrender.com/api/random/cecan_china", "China Cecan", userConfig);
});

// 4. Cecan Jepang
cmd({
    pattern: "japan",
    alias: ["cecanjepang", "jepang"],
    react: '📸',
    desc: "Get random Japan Cecan image",
    category: "random",
    filename: __filename
}, async (client, message, m, { from, userConfig }) => {
    await handleRandomApi(client, message, from, "https://techxkamran.onrender.com/api/random/cecan_jepang", "Japan Cecan", userConfig);
});

// 5. Blue Archive
cmd({
    pattern: "bluearchive",
    alias: ["ba", "blue-archive"],
    react: '🎨',
    desc: "Get random Blue Archive wallpaper/image",
    category: "anime",
    filename: __filename
}, async (client, message, m, { from, userConfig }) => {
    await handleRandomApi(client, message, from, "https://techxkamran.onrender.com/api/r/blue-archive", "Blue Archive", userConfig);
});

// 6. Cats
cmd({
    pattern: "randomcat",
    alias: ["rcats", "catpic"],
    react: '🐱',
    desc: "Get random cat image",
    category: "random",
    filename: __filename
}, async (client, message, m, { from, userConfig }) => {
    await handleRandomApi(client, message, from, "https://techxkamran.onrender.com/api/r/cats", "Random Cat", userConfig);
});
