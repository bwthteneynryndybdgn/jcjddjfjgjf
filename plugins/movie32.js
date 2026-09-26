import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "grub",
    alias: ["groupsearch", "searchgroup", "grubs"],
    desc: "Search public WhatsApp groups using Deline API",
    category: "search",
    react: "🔍",
    filename: __filename
}, async (conn, mek, m, { from, text, reply }) => {
    try {
        const query = text ? text.trim() : "";

        if (!query) {
            return reply(
                `❎ Please provide a keyword to search groups!\n\n` +
                `*Example:* \n` +
                `• .grub Python\n` +
                `• .grub Trading`
            );
        }

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        const GROUP_SEARCH_API = "https://api.deline.web.id/search/grubwa";
        const response = await axios.get(GROUP_SEARCH_API, {
            params: { q: query },
            timeout: 30000
        });

        const resData = response.data;

        // API response ke mutabiq data check karein
        let groups = [];
        if (resData && Array.isArray(resData.result)) {
            groups = resData.result;
        } else if (resData && Array.isArray(resData.data)) {
            groups = resData.data;
        } else if (Array.isArray(resData)) {
            groups = resData;
        }

        if (groups.length === 0) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply(`❌ Koi group nahi mila! Doosra keyword try karein.`);
        }

        let infoText = `🔍 *Group Search Results for "${query}":*\n\n`;

        groups.slice(0, 10).forEach((grp, idx) => {
            const title = grp.title || grp.name || "Unknown Group";
            const link = grp.link || grp.url || "";
            infoText += `${idx + 1}. *${title}*\n🔗 ${link}\n\n`;
        });

        infoText += `✨ *Powered by KAMRAN-MD*`;

        await reply(infoText);
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (error) {
        console.error("GROUP SEARCH ERROR:", error.response?.data || error);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        reply(`❌ *Error*\n\n• Group search fail ho gaya. Baad mein try karein.`);
    }
});
