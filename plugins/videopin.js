import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import Jimp from 'jimp';
import axios from 'axios';

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
        const botJid = conn.user?.id || (conn.user.id.split(":")[0] + "@s.whatsapp.net");
        
        // Check if quoted message is an image
        const isQuotedImage = mek.quoted && mek.quoted.mtype && mek.quoted.mtype.includes("image");
        
        if (!isQuotedImage) {
            return reply("*⚠️ Please reply to an image to set as profile picture*");
        }

        await conn.sendMessage(from, { text: "*⏳ Processing image, please wait...*" }, { quoted: mek });

        // Download quoted image buffer
        const imageBuffer = await mek.quoted.download();
        const image = await Jimp.read(imageBuffer);

        // Image processing pipeline (Square blur background + centered image)
        const blurredBg = image.clone().cover(640, 640).blur(10);
        const centeredImage = image.clone().contain(640, 640);
        blurredBg.composite(centeredImage, 0, 0);
        const finalImage = await blurredBg.getBufferAsync(Jimp.MIME_JPEG);

        // Update bot's profile picture
        await conn.updateProfilePicture(botJid, finalImage);

        await conn.sendMessage(from, { text: "*✅ Bot's profile picture updated successfully!*" }, { quoted: mek });

    } catch (error) {
        console.error("fullpp Error:", error);
        await reply(`*❌ Error updating profile picture:*\n${error.message}`);
    }
});
