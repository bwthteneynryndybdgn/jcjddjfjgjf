import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import { downloadMediaMessage } from '@whiskeysockets/baileys';
import Jimp from 'jimp';
import config from '../config.js';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "fullpp1",
    alias: ["setpp", "botpp"],
    use: '.fullpp (reply to an image)',
    desc: "Update bot's profile picture using a replied image",
    category: "owner",
    react: "🖼️",
    filename: __filename
},
async (conn, mek, m, { from, reply }) => {
    try {
        const botNumber = await conn.decodeJid(conn.user.id);
        const sender = m.sender || mek.key?.participant || mek.participant || from;
        const isBot = sender === botNumber;

        // Only bot owner/self can use this command
        if (!isBot) {
            return reply("❌ Yeh command sirf bot ka malik (owner) hi use kar sakta hai.");
        }

        // Check if the replied message is an image
        const quoted = mek.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        if (!quoted || !quoted.imageMessage) {
            return reply("⚠️ Baraye meharbani kisi *image (photo)* par reply karke `.fullpp` likhein.");
        }

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        // Download the image with retry mechanism
        let media;
        for (let i = 0; i < 3; i++) {
            try {
                media = await downloadMediaMessage({ key: mek.key, message: quoted }, 'buffer');
                if (media) break;
            } catch (error) {
                if (i === 2) {
                    await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
                    return reply("❌ Image download karne mein nakami hui. Dobara koshish karein.");
                }
            }
        }

        // Process image using Jimp
        const image = await Jimp.read(media);
        if (!image) throw new Error("Invalid image format");

        // Make square if needed
        const size = Math.max(image.bitmap.width, image.bitmap.height);
        if (image.bitmap.width !== image.bitmap.height) {
            const squareImage = new Jimp(size, size, 0x000000FF);
            squareImage.composite(image, (size - image.bitmap.width) / 2, (size - image.bitmap.height) / 2);
            image.clone(squareImage);
        }

        // Resize to WhatsApp requirements (640x640)
        image.resize(640, 640);
        const buffer = await image.getBufferAsync(Jimp.MIME_JPEG);

        // Update profile picture
        await conn.updateProfilePicture(botNumber, buffer);
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

        // Success response with newsletter info styling
        return conn.sendMessage(
            from,
            {
                text: "✅ *Profile Picture kamyabi ke sath update ho gayi hai!*",
                contextInfo: {
                    mentionedJid: [sender],
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363419079746471@newsletter',
                        newsletterName: "- ♛꧁༒☾FELICIAN☽༒꧂♛",
                        serverMessageId: 143
                    }
                }
            },
            { quoted: mek }
        );

    } catch (error) {
        console.error("Error setting profile picture:", error);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        return reply("❌ Profile picture update karte waqt error aa gaya.");
    }
});
