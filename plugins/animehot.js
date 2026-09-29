import fetch from 'node-fetch';
import { cmd } from '../command.js'; // اپنے فائل پاتھ کے مطابق سیٹ کریں

cmd({
    pattern: "animehot",
    alias: ["animepic"],
    desc: "Get random anime hot image",
    category: "anime",
    filename: import.meta.url
},
async (conn, mek, m, { reply, react }) => {
    try {
        await react("⏳");

        const res = await fetch("https://api.ikyyxd.my.id/random/animehot");
        
        // اگر API ڈائریکٹ امیج کا بفر واپس کرتی ہے
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("image")) {
            const buffer = await res.arrayBuffer();
            await conn.sendMessage(m.chat, { 
                image: Buffer.from(buffer), 
                caption: "🔥 *Random Anime Image*" 
            }, { quoted: mek });
            await react("✅");
            return;
        }

        // اگر API JSON ڈسپلے کرتی ہے
        const data = await res.json();
        const imageUrl = data.url || data.result || data.image;

        if (!imageUrl) {
            await react("❌");
            return reply("❌ *تصویر حاصل کرنے میں ناکامی ہوئی۔*");
        }

        await conn.sendMessage(m.chat, { 
            image: { url: imageUrl }, 
            caption: "🔥 *Random Anime Image*" 
        }, { quoted: mek });

        await react("✅");

    } catch (err) {
        console.error("AnimeHot Error:", err);
        await react("❌");
        await reply("❌ *تصویر لوڈ کرنے میں ایرر آیا۔*");
    }
});
