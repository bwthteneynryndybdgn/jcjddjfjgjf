import { fileURLToPath } from 'url';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "antitagall",
    alias: [],
    desc: "Toggle anti-tagall feature for group",
    category: "group",
    react: "🛡️",
    filename: __filename,
    group: true,
    admin: true,
    botAdmin: true
},
async (conn, mek, m, { from, reply, args }) => {
    try {
        let o = args[0] || "";

        if (!["--on", "--off"].includes(o)) {
            return reply("⚠️ Pilih opsi:\n\n• --on\n• --off");
        }

        // ⏳ React - processing
        await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });
        
        // 1000ms delay to ensure react is visible
        await new Promise(resolve => setTimeout(resolve, 1000));

        if (!global.db.data.chats[from]) {
            global.db.data.chats[from] = { antitagall: false };
        }

        switch (o) {
            case "--on":
                global.db.data.chats[from].antitagall = true;
                await reply("✅ Anti TagAll berhasil diaktifkan");
                break;

            case "--off":
                global.db.data.chats[from].antitagall = false;
                await reply("❌ Anti TagAll berhasil dinonaktifkan");
                break;
        }

        // 800ms delay before success react
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // ✅ React - success
        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });

    } catch (e) {
        console.error("Error in antitagall command:", e);
        // ❌ React - error
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
        await reply(`❌ Error updating antitagall settings: ${e.message}`);
    }
});
