// plugins/stickerly.js - ESM Version
import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import config from '../config.js';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "stickerly",
    alias: ["stickersearch", "ssearch", "searchsticker"],
    react: '✨',
    desc: "Search sticker packs from Stickerly",
    category: "search",
    filename: __filename
}, async (client, message, m, { 
    from, 
    prefix, 
    command, 
    args, 
    q, 
    isCreator,
    userConfig
}) => {
    try {
        if (!q) {
            return await client.sendMessage(from, {
                text: `*🍁 Please provide a search query for stickers!*\n\n*Example:* ${prefix + command} cute love`
            }, { quoted: message });
        }

        const DESCRIPTION = userConfig?.DESCRIPTION || config.DESCRIPTION || "Powered by Bot";

        // Initial reaction
        await client.sendMessage(from, { react: { text: '⏳', key: message.key } });

        // Stickerly Search API Endpoint
        const apiUrl = `https://techxkamran.vercel.app/api/sticker/stickerly-search?query=${encodeURIComponent(q.trim())}`;

        const response = await axios.get(apiUrl, { timeout: 30000 });
        const resData = response.data;

        // API response validation
        if (!resData || (!resData.result && !resData.data && !Array.isArray(resData))) {
            return await client.sendMessage(from, {
                text: "❌ *Koi sticker pack nahi mila!* Kripya dusra naam try karein."
            }, { quoted: message });
        }

        const stickerPacks = resData.result || resData.data || resData;

        if (!Array.isArray(stickerPacks) || stickerPacks.length === 0) {
            return await client.sendMessage(from, {
                text: "❌ *Is query par koi stickers available nahi hain!*"
            }, { quoted: message });
        }

        // Format search results
        let textMessage = `*✨ STICKERLY SEARCH RESULTS* ✨\n\n`;
        textMessage += `*Query:* ${q}\n\n`;

        stickerPacks.slice(0, 5).forEach((pack, index) => {
            textMessage += `*${index + 1}.* ${pack.title || pack.name || "Sticker Pack"}\n`;
            if (pack.author) textMessage += `   *Author:* ${pack.author}\n`;
            if (pack.link || pack.url) textMessage += `   *Link:* ${pack.link || pack.url}\n`;
            textMessage += `\n`;
        });

        textMessage += `> ${DESCRIPTION}`;

        await client.sendMessage(from, { text: textMessage }, { quoted: message });
        await client.sendMessage(from, { react: { text: '✅', key: message.key } });

    } catch (error) {
        console.error("Stickerly Search Error:", error);
        let errorMsg = error?.message || error;
        await client.sendMessage(from, {
            text: "❌ Error searching stickers:\n" + errorMsg
        }, { quoted: message });
    }
});
