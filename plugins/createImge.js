import { fileURLToPath } from 'url';
import axios from 'axios';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);

const funApis = {
    "gratitude": "Gratitude Message",
    "quotes": "Random Quote",
    "goodnight": "Good Night Wish",
    "flirt": "Flirt Message",
    "fathersday": "Father's Day Wish",
    "mothersday": "Mother's Day Wish",
    "pickupline": "Pick Up Line",
    "boyfriendsday": "Boyfriend's Day Wish",
    "newyear": "New Year Wish",
    "christmas": "Christmas Wish",
    "heartbreak": "Heartbreak Quote"
};

const aliasesList = Object.keys(funApis);

cmd({
    pattern: "fun",
    alias: aliasesList,
    desc: "Fetch fun messages, quotes, and wishes using APIs.",
    category: "fun",
    filename: __filename
},
async (conn, mek, m, { from, quoted, body, isCmd, command, args, q, reply }) => {
    try {
        let key = command.toLowerCase();
        if (!funApis[key]) {
            return;
        }

        let apiName = funApis[key];
        await reply(`⏳ Fetching ${apiName}, please wait...`);

        const apiUrl = `https://api.princetechn.com/api/fun/${key}?apikey=prince`;
        
        const response = await axios.get(apiUrl, {
            timeout: 60000,
            validateStatus: status => status >= 200 && status < 500
        });

        if (response.data) {
            let resData = response.data;
            let outputText = resData.result?.message || resData.result?.quote || resData.result?.text || resData.result || resData.message || '';

            if (typeof outputText === 'string' && outputText.length > 0) {
                return await reply(`✨ *${apiName}*:\n\n${outputText}`);
            } else {
                return await reply(`📦 *${apiName} Response:*\n\`\`\`${JSON.stringify(resData, null, 2)}\`\`\``);
            }
        } else {
            return await reply("❌ API se koi response nahi mila.");
        }

    } catch (e) {
        console.log(e);
        return await reply(`❌ Error occurred: ${e.message}`);
    }
});
