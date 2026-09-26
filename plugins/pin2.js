import axios from 'axios';
import { cmd } from '../command.js'; // اپنے بوٹ کے کمانڈ ہینڈلر کا صحیح پاتھ رکھیں

// Scraper Function Exported for ESM
export async function searchPinterest(query) {
    try {
        const { data } = await axios.get("https://api.siputzx.my.id/api/s/pinterest", {
            params: { query, type: "image" }
        });

        if (!data?.status || !data?.data?.length) {
            return { status: false, results: [] };
        }

        const validImages = data.data.filter(v => v.image_url);
        return {
            status: true,
            total: validImages.length,
            results: validImages
        };
    } catch (error) {
        return { status: false, message: error.message, results: [] };
    }
}

// ==========================================
//          WHATSAPP BOT COMMAND
// ==========================================

cmd({
    pattern: "pinterest",
    alias: ["pin", "pinsearch"],
    desc: "Search images from Pinterest",
    category: "search",
    filename: import.meta.url
},
async (conn, mek, m, { q, reply, react }) => {
    try {
        if (!q) {
            await react("❌");
            return reply("⚠️ *براہ کرم تلاش کرنے کے لیے لفظ لکھیں!*\n\n*مثال:* `.pin anime wallpaper`");
        }

        await react("🔍");

        const data = await searchPinterest(q);

        if (!data.status || !data.results.length) {
            await react("❌");
            return reply("❌ *تصاویر نہیں مل سکیں۔*");
        }

        // WhatsApp media album limit safe size (Max 5 to 10 photos)
        const sliceImages = data.results.slice(0, 5);

        await react("📥");

        // Send images batch to WhatsApp chat
        for (let i = 0; i < sliceImages.length; i++) {
            const item = sliceImages[i];
            const caption = i === 0 ? `📌 *Pinterest Search Result for:* ${q}\n📊 *Total Found:* ${data.total}` : '';

            await conn.sendMessage(m.chat, {
                image: { url: item.image_url },
                caption: caption
            }, { quoted: mek });
        }

        await react("✅");

    } catch (err) {
        console.error("Pinterest Command Error:", err);
        await react("❌");
        await reply(`❌ *Error:* ${err.message}`);
    }
});
