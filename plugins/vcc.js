import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "vcc",
    alias: ["card", "virtualcard", "cc"],
    use: '.vcc <visa / mastercard / american-express / jcb>',
    desc: "Generate virtual credit cards of different types",
    category: "tools",
    react: "💳",
    filename: __filename
},
async (conn, mek, m, { from, text, reply, command }) => {
    try {
        const inputType = String(text || "").trim().toLowerCase();

        // Agar user ne koi type nahi di, toh 4-5 behtareen qasmon (types) ki list show kar do
        const validTypes = ["visa", "mastercard", "american-express", "jcb"];
        
        if (!inputType || !validTypes.includes(inputType)) {
            let menuText = `> *💳 KAMRAN-MD VCC GENERATOR* 💳\n\n`;
            menuText += `⚠️ Baraye meharbani koi valid card type likhein!\n\n`;
            menuText += `*Dastiyab Qasmen (Available Types):*\n`;
            menuText += `─────────────────────────\n`;
            menuText += `• \`.vcc visa\`\n`;
            menuText += `• \`.vcc mastercard\`\n`;
            menuText += `• \`.vcc american-express\`\n`;
            menuText += `• \`.vcc jcb\`\n`;
            menuText += `─────────────────────────\n`;
            menuText += `_Misal ke tor par:_\n`.trim();
            menuText += `\`.vcc mastercard\``;

            await conn.sendMessage(from, { text: menuText }, { quoted: mek });
            await conn.sendMessage(from, { react: { text: "💡", key: mek.key } });
            return;
        }

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        const apiUrl = `https://api.nexray.eu.cc/tools/vcc?type=${encodeURIComponent(inputType)}`;
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply(`❌ API request fail ho gayi. (Status: ${response.status})`);
        }

        const data = await response.json();

        if (!data.status || !data.result || data.result.length === 0) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply(`❌ '${inputType.toUpperCase()}' type ke liye koi card nahi mila.`);
        }

        let responseText = `> *💳 KAMRAN-MD VCC GENERATOR* 💳\n`;
        responseText += `> *Card Type:* ${inputType.toUpperCase()}\n`;
        responseText += `> *Author:* ${data.author || '@nexray'}\n\n`;
        responseText += `─────────────────────────\n\n`;

        // Har ek card ko stylish format mein display karna
        data.result.forEach((card, index) => {
            responseText += `*#${index + 1} ── [ ${card.type} ]* \n`;
            responseText += `👤 *Name:* \`${card.name}\`\n`;
            responseText += `💳 *Number:* \`${card.number}\`\n`;
            responseText += `🔑 *CVV:* \`${card.cvv}\`\n`;
            responseText += `⏳ *Expiry:* \`${card.expiry}\`\n`;
            responseText += `─────────────────────────\n\n`;
        });

        await conn.sendMessage(from, { text: responseText.trim() }, { quoted: mek });
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
        console.error("[VCC ERROR]", e);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        return reply(`❌ Error: ${e.message}`);
    }
});
