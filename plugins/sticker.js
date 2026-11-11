import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { Sticker, StickerTypes } from 'wa-sticker-formatter';
import { cmd } from '../command.js';
// Use default import (most common in bot bases)
import converter from '../lib/converter.js'; 

// Helper function to fetch buffer from a URL (replaces the missing fetchGif)
async function getBuffer(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer);
    } catch (error) {
        throw new Error(`Failed to fetch buffer: ${error.message}`);
    }
}

// Mega Sticker Command
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
                media = await mek.quoted.download();
                
                // Call via default import object
                if (typeof converter.videoToWebp === 'function') {
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
                    // Fallback: wa-sticker-formatter can handle video buffers directly in newer versions
                    let sticker = new Sticker(media, {
                        pack: pack,
                        type: StickerTypes.FULL,
                        categories: ["🤩", "🎉"],
                        id: crypto.randomBytes(4).toString('hex'),
                        quality: 75,
                        background: 'transparent',
                    });
                    stickerBuffer = await sticker.toBuffer();
                }
                
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
        if (!args || args.length === 0) return reply("*Please provide text!*");

        const text = args.join(' ');
        const apiUrl = `https://api-fix.onrender.com/api/maker/attp?text=${encodeURIComponent(text)}`;
        
        // 1. Fetch the GIF buffer using our built-in helper
        const gifBuffer = await getBuffer(apiUrl);
        
        // 2. Convert toThe error `The requested module '../lib/converter.js' does not provide an export named 'fetchGif'` confirms that your `converter.js` file **does not** have a function named `fetchGif`.

In most WhatsApp bot frameworks, `fetchGif` (or simply fetching data from a URL) is usually handled by a separate library like `node-fetch` or `axios`, or it's a simple helper function that might be missing from your `converter.js`.

### ✅ Solution: Fix the Import and Add Missing Function

We need to do two things:
1.  **Stop importing `fetchGif`** from `converter.js` if it doesn't exist there.
2.  **Use a standard HTTP client** (like `node-fetch` or `axios`) to fetch the GIF, or check if your bot has a global `fetch` function available (Node.js 18+ has built-in `fetch`).

Since you are using Node.js (likely version 18+ given the 2026 date), you can use the built-in `fetch` API.

#### Step 1: Update `plugins/sticker.js`

Replace your entire file content with this corrected version. I have removed `fetchGif` from the import and replaced it with the native `fetch` API.

```javascript
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { Sticker, StickerTypes } from 'wa-sticker-formatter';
import { cmd } from '../command.js';
// Import only the functions that actually exist in converter.js
// If you are still unsure, try importing the default object as shown below
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
                
                // Use converter.videoToWebp if it exists, otherwise handle error
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
