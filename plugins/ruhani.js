import { fileURLToPath } from 'url';
import axios from 'axios';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "define",
    alias: ["meaning", "dictionary"],
    desc: "Get the definition of a term using the definition API.",
    category: "tools",
    filename: __filename
},
async (conn, mek, m, { from, quoted, body, isCmd, command, args, q, reply }) => {
    try {
        let term = q ? q.trim() : "";

        if (!term && m.quoted) {
            term = m.quoted.text || m.quoted.caption || "";
        }

        if (!term) {
            return await reply("❌ Please provide a term to define!\n\n*Usage:* \n.define cat");
        }

        await reply("⏳ Searching for definition, please wait...");

        const apiUrl = `https://api.princetechn.com/api/tools/define?apikey=prince&term=${encodeURIComponent(term)}`;
        
        const response = await axios.get(apiUrl, {
            timeout: 60000,
            validateStatus: status => status >= 200 && status < 500
        });

        if (response.data) {
            let resData = response.data;
            
            // Correct path handling for results array
            let definition = "";
            if (resData.results && Array.isArray(resData.results) && resData.results.length > 0) {
                definition = resData.results[0].definition;
            } else if (resData.result?.definition) {
                definition = resData.result.definition;
            }

            if (typeof definition === 'string' && definition.length > 0) {
                return await reply(`📖 *Definition of ${term}:*\n\n${definition}`);
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
