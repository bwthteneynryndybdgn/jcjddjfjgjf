import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "fancy",
    alias: ["stylish", "font", "fancytext"],
    desc: "Generate specific fancy font by number",
    category: "tools",
    react: "✨",
    filename: __filename
}, async (conn, mek, m, { from, text, reply, args }) => {
    try {
        if (!text) {
            return reply(
                `⚠️ *Fancy Text Generator*\n\n` +
                `Usage Methods:\n` +
                `1️⃣ View all styles list:\n• _.fancy list Dr Kamran_\n\n` +
                `2️⃣ Get specific style directly by number:\n• _.fancy 4 Dr Kamran_`
            );
        }

        const encodedText = encodeURIComponent(text.trim());
        const apiUrl = `https://api.princetechn.com/api/tools/fancy?apikey=prince&text=${encodedText}`;
        
        // Agar user ne 'list' maanga hai ya sirf text diya hai
        if (args[0].toLowerCase() === 'list') {
            const actualText = args.slice(1).join(" ");
            if (!actualText) return reply("⚠️ Please provide text after 'list'. Example: _.fancy list Dr Kamran_");
            
            await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });
            const response = await axios.get(`https://api.princetechn.com/api/tools/fancy?apikey=prince&text=${encodeURIComponent(actualText)}`, { timeout: 30000 });
            const resData = response.data;

            if (!resData || !resData.results) return reply("❌ Failed to fetch styles.");

            let formattedText = `✨ *KAMRAN-MD FANCY STYLES LIST* ✨\n\n`;
            resData.results.forEach((item, index) => {
                formattedText += `*${index + 1}.* ${item.name}\n`;
            });
            formattedText += `\n💡 *Tip:* Use style number to get clean text:\n_.<number> ${actualText}_ (e.g. _.4 Dr Kamran_)\n\n> Powered by KAMRAN-MD`;
            
            await reply(formattedText);
            return await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
        }

        // Agar user ne number diya hai (jaise .fancy 4 Dr Kamran)
        const styleIndex = parseInt(args[0]);
        const actualText = args.slice(1).join(" ");

        if (!isNaN(styleIndex) && actualText) {
            await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });
            const response = await axios.get(`https://api.princetechn.com/api/tools/fancy?apikey=prince&text=${encodeURIComponent(actualText)}`, { timeout: 30000 });
            const resData = response.data;

            if (!resData || !resData.results || !resData.results[styleIndex - 1]) {
                return reply("❌ Invalid style number! Check list using _.fancy list <text>_");
            }

            const selectedStyle = resData.results[styleIndex - 1];
            const resultMsg = `✨ *${selectedStyle.name} Style* ✨\n\n\`\`\`${selectedStyle.result}\`\`\`\n\n> Powered by KAMRAN-MD`;
            
            await reply(resultMsg);
            return await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
        }

        // Default behavior: agar sirf text diya hai toh list dikhaye
        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });
        const response = await axios.get(apiUrl, { timeout: 30000 });
        const resData = response.data;

        if (!resData || !resData.results) return reply("❌ Could not generate fancy text.");

        let formattedText = `✨ *KAMRAN-MD FANCY STYLES* ✨\n\n`;
        resData.results.forEach((item, index) => {
            formattedText += `*${index + 1}.* ${item.name}: \`${item.result}\`\n`;
        });
        formattedText += `\n> Powered by KAMRAN-MD`;

        await reply(formattedText);
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (error) {
        console.error("KAMRAN-MD Fancy Error:", error);
        reply(`❌ Error: ${error.message}`);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
    }
});
