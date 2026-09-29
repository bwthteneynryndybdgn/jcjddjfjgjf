import fetch from 'node-fetch';
import { cmd } from '../command.js'; // اپنے فائل پاتھ کے مطابق سیٹ کریں

cmd({
    pattern: "fixerror",
    alias: ["fixcode", "fix"],
    desc: "Fix coding errors using AI tool API",
    category: "tools",
    filename: import.meta.url
},
async (conn, mek, m, { q, reply, react }) => {
    try {
        if (!q) {
            await react("❌");
            return reply("⚠️ *براہ کرم وہ کوڈ لکھیں جس کا ایرر فکس کرنا ہے!*\n\n*مثال:* `.fixerror const x = `");
        }

        await react("🛠️");

        const apiUrl = `https://api.ikyyxd.my.id/tools/fixerror?code=${encodeURIComponent(q)}`;
        const res = await fetch(apiUrl);
        const data = await res.json();

        // API Response Checking
        const fixedResult = data.result || data.fixedCode || data.data || data;

        if (!fixedResult) {
            await react("❌");
            return reply("❌ *کوڈ فکس کرنے میں ناکامی ہوئی۔ براہ کرم دوبارہ کوشش کریں۔*");
        }

        const replyMessage = typeof fixedResult === 'string' ? fixedResult : JSON.stringify(fixedResult, null, 2);

        await reply(`🛠️ *Fixed Code / Response:*\n\n\`\`\`javascript\n${replyMessage}\n\`\`\``);
        await react("✅");

    } catch (err) {
        console.error("Fix Code Error:", err);
        await react("❌");
        await reply("❌ *سرور سے رابطہ قائم کرنے میں ایرر آیا۔*");
    }
});
