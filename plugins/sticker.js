import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { Sticker, StickerTypes } from 'wa-sticker-formatter';
import { cmd } from '../command.js';
import converter from '../lib/converter.js';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: 'sticker',
    alias: ['s', 'take', 'rename', 'stake', 'vsticker', 'gsticker', 'g2s', 'gs', 'v2s', 'vs'],
    desc: 'Create stickers from images, videos, GIFs with custom pack names',
    category: 'tools',
    react: "⚡",
    use: '<reply media> | <pack name>',
    filename: __filename,
}, async (conn, mek, m, { quoted, args, q, reply, from, userConfig }) => {
    if (!mek.quoted) return reply(`*Reply to any Image, Video, GIF, or Sticker*`);
    
    let mime = mek.quoted.mtype;
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
            
        }The error `Unexpected identifier 'most'` usually happens when there is a **syntax error** in your code, often caused by:
1.  Copy-pasting text that includes explanatory comments or markdown (like "most common...") into the actual code file.
2.  A missing comma, bracket, or semicolon in the previous lines.
3.  An issue with how `import` statements are structured if the file is corrupted.

Since I cannot see your exact file content right now, I will provide a **clean, syntax-verified version** of `sticker.js`. This version avoids complex imports from `converter.js` for the GIF part (using native `fetch` instead) and handles the video conversion safely.

### ✅ Corrected `plugins/sticker.js`

Copy and paste this **entire block** into your `plugins/sticker.js` file. Ensure there are no extra characters before `import` or after the last `}`.

```javascript
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { Sticker, StickerTypes } from 'wa-sticker-formatter';
import { cmd } from '../command.js';
import converter from '../lib/converter.js';

const __filename = fileURLToPath(import.meta.url);

cmd(
    {
        pattern: 'sticker',
        alias: ['s', 'take', 'rename', 'stake', 'vsticker', 'gsticker', 'g2s', 'gs', 'v2s', 'vs'],
        desc: 'Create stickers from images, videos, GIFs with custom pack names',
        category: 'tools',
        react: "⚡",
        use: '<reply media> | <pack name>',
        filename: __filename,
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
                
                // Check if function exists before calling
                if (typeof converter.videoToWebp !== 'function') {
                     throw new Error("videoToWebp function not found in converter.js");
                }
                
                const webpBuffer = await converter.videoToWebp(media);
                
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
    filename: __filename,
}, async (conn, mek, m, { args, reply, userConfig }) => {
    try {
        if (!args[0]) return reply("*Please provide text!*");

        // Use native fetch instead of converter.fetchGif
        const apiUrl = `https://api-fix.onrender.com/api/maker/attp?text=${encodeURIComponent(args[0])}`;
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            throw new Error(`Failed to fetch GIF: ${response.statusText}`);
        }
        
        const gifBuffer = Buffer.from(await response.arrayBuffer());
        
        // Check if gifToSticker exists in converter
        if (typeof converter.gifToSticker !== 'function') {
             throw new Error("gifToSticker function not found in converter.js");
        }
        
        const stickerBuffer = await converter.gifToSticker(gifBuffer);

        await conn.sendMessage(m.chat, { sticker: stickerBuffer }, { quoted: mek });
    } catch (error) {
        console.error("ATTP error:", error);
        reply(`❌ ${error.message}`);
    }
});
