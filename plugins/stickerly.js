// plugins/random.js - ESM Version
import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import config from '../config.js';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);

// Helper function to handle random image API requests
const handleRandomApi = async (client, message, from, apiUrl, title, userConfig) => {
    try {
        const DESCRIPTION = userConfig?.DESCRIPTION || config.DESCRIPTION || "Powered by Bot";

        await client.sendMessage(from, { react: { text: '⏳', key: message.key } });

        const response = await axios.get(apiUrl, { timeout: 30000 });
        const resData = response.data;

        // Flexible image URL extraction from different API responses
        const imageUrl = resData.url || 
                         resData.result || 
                         resData.data?.url || 
                         resData.image ||
                         (typeof resData === 'string' ? resData : null);

        if (!imageUrl) {
            return await client.sendMessage(from, {
                text: "❌ *Image fetch nahi ho saki! Response me URL nahi mila.*"
            }, { quoted: message });
        }

        let caption = `*✨ ${title.toUpperCase()}* ✨\n\n> ${DESCRIPTION}`;

        await client.sendMessage(from, {
            image: { url: imageUrl },
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
