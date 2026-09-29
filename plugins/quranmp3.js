import { fileURLToPath } from 'url';
import axios from 'axios';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);

const ephotoEffects = {
    "advancedglow": "Advanced Glow",
    "glitchtext": "Glitch Text",
    "blackpinklogo": "Blackpink Logo",
    "pixelglitch": "Pixel Glitch",
    "typographytext": "Typography Text",
    "neonglitch": "Neon Glitch",
    "americanflag": "American Flag",
    "blackpinkstyle": "Blackpink Style",
    "logomaker": "Logo Maker",
    "cartoonstyle": "Cartoon Style",
    "effectclouds": "Effect Clouds",
    "gradienttext": "Gradient Text",
    "sandsummer": "Sand Summer",
    "galaxy": "Galaxy",
    "1917": "1917 Style",
    "lighteffect": "Light Effect",
    "galaxystyle": "Galaxy Style",
    "glossysilver": "Glossy Silver"
};

const aliasesList = Object.keys(ephotoEffects);

cmd({
    pattern: "ephoto",
    alias: aliasesList,
    desc: "Generate various Ephoto360 text effects.",
    category: "logo",
    filename: __filename
},
async (conn, mek, m, { from, quoted, body, isCmd, command, args, q, reply }) => {
    try {
        let effectKey = command.toLowerCase();
        if (!ephotoEffects[effectKey]) {
            return;
        }

        let text = q ? q.trim() : "";

        if (!text && m.quoted) {
            text = m.quoted.text || m.quoted.caption || "";
        }

        if (!text) {
            return await reply(`❌ Please provide text for the logo!\n\n*Usage:* \n.${effectKey} DR KAMRAN`);
        }

        let effectName = ephotoEffects[effectKey];
        await reply(`⏳ Generating ${effectName} effect, please wait...`);

        const apiUrl = `https://api.princetechn.com/api/ephoto360/${effectKey}?apikey=prince&text=${encodeURIComponent(text)}`;
        
        const response = await axios.get(apiUrl, {
            timeout: 60000,
            validateStatus: status => status >= 200 && status < 500
        });

        if (response.data) {
            let resData = response.data;
            let imageUrl = resData.result?.image_url || resData.result?.url || resData.url || resData.image || '';

            if (typeof imageUrl === 'string' && imageUrl.startsWith('http')) {
                return await conn.sendMessage(from, { 
                    image: { url: imageUrl }, 
                    caption: `✨ *${effectName} Effect for:* ${text}` 
                }, { quoted: mek });
            } else {
                return await reply(`📦 *API Response:*\n\`\`\`${JSON.stringify(resData, null, 2)}\`\`\``);
            }
        } else {
            return await reply("❌ API se koi response nahi mila.");
        }

    } catch (e) {
        console.log(e);
        return await reply(`❌ Error occurred: ${e.message}`);
    }
});
