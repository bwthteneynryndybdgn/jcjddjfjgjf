// DR KAMRAN 

import { fileURLToPath } from 'url';
import axios from 'axios';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "img",
    desc: "Search images from Google Image search",
    category: "search",
    react: "🖼️",
    filename: __filename
},
async (conn, mek, m, { from, quoted, body, isCmd, command, args, q, reply }) => {
    try {
        if (!q) {
            return reply(
                `╔════════════════════════╗\n` +
                `║   🖼️ KAMRAN-MD GOOGLE IMAGE 🖼️   \n` +
                `╚════════════════════════╝\n\n` +
                `❌ *Kripya image search ke liye query dein!*\n\n` +
                `> 📌 *Example:* \`.gimage Cute Cat\`\n` +
                `> ⚡ *Version:* \`10.00\``
            );
        }

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        const url = `https://api.princetechn.com/api/search/googleimage?apikey=prince&query=${encodeURIComponent(q)}`;
        const response = await axios.get(url, { timeout: 60000 });
        
        // Debugging ke liye console log check karein
        console.log("Google Image API Response:", response.data);

        if (response.data) {
            // Check all possible response structures (Array of images, result array, or object properties)
            let images = [];
            
            if (Array.isArray(response.data)) {
                images = response.data;
            } else if (response.data.result && Array.isArray(response.data.result)) {
                images = response.data.result;
            } else if (response.data.data && Array.isArray(response.data.data)) {
                images = response.data.data;
            } else if (typeof response.data.result === 'string') {
                images = [response.data.result];
            } else if (typeof response.data === 'object') {
                // Agar object ke andar koi aur array ya link ho
                const possibleKey = Object.keys(response.data).find(k => Array.isArray(response.data[k]));
                if (possibleKey) {
                    images = response.data[possibleKey];
                }
            }

            const imageUrl = images[0]?.url || images[0]?.image || (typeof images[0] === 'string' ? images[0] : null) || response.data.url || response.data.image;

            if (!imageUrl) {
                await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
                return reply(`❌ *Koi image nahi mili!* \n\n\`\`\`${JSON.stringify(response.data, null, 2)}\`\`\``);
            }

            const imgBox = `
╔════════════════════════╗
║   🖼️ GOOGLE IMAGE SEARCH   
╚════════════════════════╝

🔍 *Query:* ${q}

> ⚡ *Version:* \`10.00\`
> 👑 *Powered by KAMRAN MD*`.trim();

            await conn.sendMessage(from, { 
                image: { url: imageUrl }, 
                caption: imgBox 
            }, { quoted: mek });

            await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
        } else {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ *API se koi response nahi mila!*");
        }

    } catch (e) {
        console.error("Google Image Command Error:", e);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        return reply(`❌ *Error occurred:* \`\`\`${e.message}\`\`\``);
    }
});
