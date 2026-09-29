import { fileURLToPath } from 'url';
import axios from 'axios';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "proxy",
    desc: "Get latest proxy list.",
    category: "tools",
    filename: __filename
},
async (conn, mek, m, { from, quoted, body, isCmd, command, args, q, isGroup, sender, reply }) => {
    try {
        // User ko batane ke liye ki process ho raha hai
        await reply("🔄 Fetching proxies, please wait...");

        const url = "https://api.princetechn.com/api/tools/proxy?apikey=prince";
        const response = await axios.get(url);
        
        // Agar API ka response successfully mil jata hai
        if (response.data) {
            let proxyData = response.data;
            
            if (typeof proxyData === 'object') {
                proxyData = JSON.stringify(proxyData, null, 2);
            }

            // Chat me result bhejna
            const msg = `*🌐 PROXY FETCHED SUCCESSFULLY*\n\n${proxyData}\n\n> Powered by KAMRAN MD`;
            return await reply(msg);
        } else {
            return await reply("❌ Proxy data nahi mil saka. API me koi dikkat hai.");
        }

    } catch (e) {
        console.log(e);
        return await reply(`❌ An error occurred: ${e.message}`);
    }
});
