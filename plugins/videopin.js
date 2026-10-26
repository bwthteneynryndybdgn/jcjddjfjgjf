import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import Jimp from 'jimp';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "fullpp1",
    alias: ["setpp", "setdp", "pp"],
    react: "🖼️",
    desc: "Set full image as bot's profile picture",
    category: "tools",
    filename: __filename
}, 
async (conn, mek, m, { from, reply }) => {
    try {
        const botJid = conn.user?.id || (conn.user?.id?.split(":")[0] + "@s.whatsapp.net");

        // Check if message has quoted image
        const quoted = mek.quoted ? mek.quoted : mek;
        const mime = (quoted.msg || quoted).mimetype || '';
        
        if (!mime || !mime.includes("image")) {
            return reply("*⚠️ Baraye meharbani kisi image par reply kar ke .fullpp likhein!*");
        }

        await conn.sendMessage(from, { text: "*⏳ Image process ho rahi hai, intezaar karein...*" }, { quoted: mek });

        // Download image buffer safely
        const imageBuffer = await quoted.download();
        if (!imageBuffer) {
            return reply("*❌ Image download karne mein nakami hui.*");
        }

        const image = await Jimp.read(imageBuffer);

        // Square blur background + centered image pipeline
        const blurredBg = image.clone().cover(640, 640).blur(10);
        const centeredImage = image.clone().contain(640, 640);
        blurredBg.composite(centeredImage, 0, 0);
        const finalImage = await blurredBg.getBufferAsync(Jimp.MIME_JPEG);

        // Update profile picture
        await conn.updateProfilePicture(botJid, finalImage);

        await conn.sendMessage(from, { text: "*✅ Bot ki profile picture kamyabi ke sath update ho gayi hai!*" }, { quoted: mek });

    } catch (error) {
        console.error("fullpp Error:", error);
        await reply(`*❌ Error updating profile picture:*\n${error.message}`);
    }
});
