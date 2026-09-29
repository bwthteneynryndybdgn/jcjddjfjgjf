import { fileURLToPath } from 'url';
import axios from 'axios';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "newscountries",
    alias: ["newscountry", "streamcountries"],
    desc: "Get available countries for news streaming using the news API.",
    category: "news",
    filename: __filename
},
async (conn, mek, m, { from, quoted, body, isCmd, command, args, q, reply }) => {
    try {
        await reply("⏳ Fetching available news countries, please wait...");

        const apiUrl = `https://api.princetechn.com/api/newsstreaming/countries?apikey=prince`;
        
        const response = await axios.get(apiUrl, {
            timeout: 60000,
            validateStatus: status => status >= 200 && status < 500
        });

        if (response.data) {
            let resData = response.data;
            
            // Checking if result contains the countries data
            let countries = resData.result || resData.countries || resData;

            return await reply(`📰 *Available News Countries:*\n\`\`\`${JSON.stringify(countries, null, 2)}\`\`\``);
        } else {
            return await reply("❌ API se koi response nahi mila.");
        }

    } catch (e) {
        console.log(e);
        return await reply(`❌ Error occurred: ${e.message}`);
    }
});
