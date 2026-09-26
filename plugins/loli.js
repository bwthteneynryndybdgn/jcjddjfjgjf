import { fileURLToPath } from 'url';
import axios from 'axios';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "loli", // Is command ko run karne ke liye `.loli` likhna hoga
    desc: "Get random anime neko images.",
    category: "anime",
    filename: __filename
},
async (conn, mek, m, { from, quoted, body, isCmd, command, args, q, reply }) => {
    try {
        // User ko batane ke liye ki image load ho rahi hai
        await reply("🐱 Fetching random Neko image, please wait...");

        const url = "https://api.princetechn.com/api/anime/loli?apikey=prince";
        const response = await axios.get(url);
        
        // Aamtaur par anime APIs JSON me 'url' ya 'result' ke andar image link deti hain
        // Agar aapki API ka format alag ho to ise change kar sakte hain
        let imageUrl = response.data.url || response.data.result || response.data.link;

        if (imageUrl) {
            // WhatsApp par image send karne ka standard tarika
            await conn.sendMessage(from, { 
                image: { url: imageUrl }, 
                caption: "✨ *Here is your Neko Image!* ✨\n\n> Powered by DR KAMRAN" 
            }, { quoted: mek });
            
        } else {
            // Agar API direct image data de rahi hai (JSON nahi hai), to direct url use karenge
            await conn.sendMessage(from, { 
                image: { url: url }, 
                caption: "✨ *Here is your Neko Image!* ✨" 
            }, { quoted: mek });
        }

    } catch (e) {
        console.log(e);
        return await reply(`❌ Error occurred: ${e.message}`);
    }
});
