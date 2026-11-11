import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { Sticker, StickerTypes } from 'wa-sticker-formatter';
import { cmd } from '../command.js';
// Import specific functions directly
import { videoToWebp, gifToSticker, fetchGif } from '../lib/fetchgif.js'; 

cmd(
    {
        pattern: 'sticker',
        alias: ['s', 'take', 'rename', 'stake', 'vsticker', 'gsticker', 'g2s', 'gs', 'v2s', 'vs'],
        desc: 'Create stickers from images, videos, GIFs with custom pack names',
        category: 'tools',
        react: "⚡",
        use: '<reply media> | <pack name>',
        filename: fileURLToPath(import.meta.url),
    },
    async (conn, mek, m, { quoted, args, q, reply, from, userConfig }) => {
        if (!mek.quoted) return reply(`*Reply to any Image, Video, GIF, or Sticker*`);
        
        let mime = mek.quoted.mtype;
        
        // Determine pack name
        const defaultPackName = userConfig?.STICKER_NAME || global.config?.STICKER_NAME || "DR KAMRAN";
        let pack = q ? q : defaultPackName;
        
        try {
            let media, stickerBuffer;
            
            if (mime === "imageMessage" || mime === "stickerMessage") {
                media = await mek.quoted.download();
                
                let sticker = new Sticker(media, {
                    pack: pack, 
                    type: StickerTypes.FULL,
                    categories: ["🤩", "🎉"],
                    id: crypto.randomBytes(4).toString('hex'),
                    quality: 75,
                    background: 'transparent',
                });
                stickerBuffer = await sticker.toBuffer();
                
            } else if (mime === "videoMessage") {
                // For videos - convert to WebP first
                media = await mek.quoted.download();
                
                // Use the imported function directly
                const webpBuffer = await videoToWebp(media);
                
                let sticker = new Sticker(webpBuffer, {
                    pack: pack,
                    type: StickerTypes.FULL,
                    categories: ["🤩", "🎉"],
                    id: crypto.randomBytes(4).toString('hex'),
                    quality: 75,
                    background: 'transparent',
                });
                stickerBuffer = await sticker.toBuffer();
                
            } else {
                return reply("*Please reply to an image, video, GIF, or sticker*");
            }
            
            return conn.sendMessage(mek.chat, { sticker: stickerBuffer }, { quoted: mek });
            
        } catch (error) {
            console.error("Sticker creation error:", error);
            return reply(`*Error creating sticker: ${error.message}*`);
        }
    }
);

// attp command
cmd({
    pattern: "attp",
    desc: "Convert text to a GIF sticker.",
    react: "✨",
    category: "tools", 
    use: ".attp HI",
    filename: fileURLToPath(import.meta.url),
}, async (conn, mek, m, { args, reply, userConfig }) => {
    try {
        if (!args[0]) return reply("*Please provide text!*");

        // Use imported functions directly
        const gifBuffer = await fetchGif(`https://api-fix.onrender.com/api/maker/attp?text=${encodeURIComponent(args[0])}`);
        const stickerBuffer = await gifToSticker(gifBuffer);

        await conn.sendMessage(m.chat, { sticker: stickerBuffer }, { quoted: mek });
    } catch (error) {
        console.error("ATTP error:", error);
        reply(`❌ ${error.message}`);
    }
});
