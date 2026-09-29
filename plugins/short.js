import { fileURLToPath } from 'url';
import axios from 'axios';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "short",
    alias: ["tiny", "shortlink"],
    desc: "Shorten long URLs",
    category: "tools",
    filename: __filename
}, async (conn, mek, m, { q, reply }) => {
    try {
        if (!q || !q.startsWith('http')) return reply("❌ Please provide a valid URL starting with http:// or https://");

        const res = await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(q)}`);
        
        if (res.data) {
            return reply(`🔗 *Shortened Link:* ${res.data}\n\n> Powered by KAMRAN MD`);
        } else {
            return reply("❌ Failed to shorten URL.");
        }
    } catch (e) {
        console.error(e);
        reply("❌ Error occurred while shortening link.");
    }
});

