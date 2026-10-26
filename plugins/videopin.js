//---------------------------------------------------------------------------
//           KAMRAN-MD - FULL PROFILE PICTURE PLUGIN
//---------------------------------------------------------------------------

import Jimp from 'jimp';
import { fileURLToPath } from 'url';
import path from 'path';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

cmd({
    pattern: "fullpp1",
    alias: ["setpp", "setdp", "pp"],
    react: "🖼️",
    desc: "Set full image as bot's profile picture",
    category: "tools",
    filename: __filename
},
async (conn, mek, m, { from, isCreator, reply, socket, sock }) => {
    const client = socket || sock || conn;
    const chatId = from || m.chat;
    const sender = m.sender;

    try {
        // Get bot's JID safely
        const botJid = client.user?.id ? (client.user.id.includes(':') ? client.user.id.split(':')[0] + '@s.whatsapp.net' : client.user.id) : null;
        
        // Allow bot owner or bot itself
        if (sender !== botJid && !isCreator) {
            return reply("*📛 This command can only be used by the bot or its owner.*");
        }

        // Check if quoted message is an image
        const quoted = mek.msg?.contextInfo?.quotedMessage;
        const isQuotedImage = quoted && (quoted.imageMessage || (quoted.viewOnceMessageV2 && quoted.viewOnceMessageV2.message?.imageMessage));

        if (!isQuotedImage && !m.quoted) {
            return reply("*⚠️ Please reply to an image to set as profile picture*");
        }

        await reply("*⏳ Processing image, please wait...*");

        // Download quoted media
        const imageBuffer = await m.quoted.download();
        if (!imageBuffer) {
            return reply("*❌ Ghalat media! Kripya kisi image ko reply karein.*");
        }

        const image = await Jimp.read(imageBuffer);

        // Image processing pipeline (Square blur background + contain foreground)
        const blurredBg = image.clone().cover(640, 640).blur(10);
        const centeredImage = image.clone().contain(640, 640);
        blurredBg.composite(centeredImage, 0, 0);
        const finalImage = await blurredBg.getBufferAsync(Jimp.MIME_JPEG);

        // Update profile picture
        if (botJid) {
            await client.updateProfilePicture(botJid, finalImage);
        } else {
            await client.updateProfilePicture(client.user.id, finalImage);
        }

        await reply("*✅ Bot's profile picture updated successfully!*");

    } catch (error) {
        console.error("fullpp Error:", error);
        return reply(`*❌ Error updating profile picture:*\n${error.message}`);
    }
});
