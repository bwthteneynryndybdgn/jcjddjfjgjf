import { fileURLToPath } from 'url';
import axios from 'axios';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "pinterest",
    alias: ["pin", "pinterestsearch", "pindl"],
    desc: "Search and download images from Pinterest.",
    category: "search",
    filename: __filename
},
async (conn, mek, m, { from, quoted, body, args, q, reply }) => {
    try {
        // Safe query string validation
        if (!q || typeof q !== 'string' || !q.trim()) {
            return reply("❌ *Format Galat Hai!*\n\n*Usage:* `,pinterest [Search Query]`\n\n*Example:* `,pinterest anime boy` or `,pinterest dark wallpaper`");
        }

        await reply("🔍 *Searching Pinterest database... Please wait.*");

        const endpointUrl = `https://api-xemoz-official.my.id/api/search/pinterest.php?q=${encodeURIComponent(q.trim())}`;

        const response = await axios.get(endpointUrl, { 
            timeout: 60000,
            validateStatus: () => true,
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            }
        });

        let data = response.data;
        
        // Safe JSON parsing layer
        if (typeof data === 'string') {
            try {
                data = JSON.parse(data);
            } catch (e) {
                return reply("❌ *Server Error:* Invalid JSON data format received.");
            }
        }

        // 🎯 MATCHING XEMOZ API BOOTSTRAP STRUCTURE
        if (response.status === 200 && (data?.status === true || data?.status === 200)) {
            const results = data.result;

            // Check if results array exists and has contents
            if (!results || (Array.isArray(results) && results.length === 0)) {
                return reply("❌ No images found matching your search query.");
            }

            // Extract image URL safely (Handles both array of strings or array of objects)
            let imageUrl = "";
            let totalResults = 1;

            if (Array.isArray(results)) {
                totalResults = results.length;
                let firstItem = results[0];
                
                if (typeof firstItem === 'string') {
                    imageUrl = firstItem;
                } else if (typeof firstItem === 'object' && firstItem !== null) {
                    imageUrl = firstItem.url || firstItem.image || firstItem.link || firstItem.downloadUrl;
                }
            } else if (typeof results === 'string') {
                imageUrl = results;
            }

            if (!imageUrl) {
                return reply("❌ Failed to extract image stream from the server array.");
            }

            // Crafting caption details
            let captionText = `📌 *PINTEREST IMAGE FINDER* 📌\n\n`;
            captionText += `🔍 *Query:* ${q.trim()}\n`;
            captionText += `📊 *Total Found:* ${totalResults} images available\n`;
            captionText += `✨ *Delivering:* Top matching result\n\n`;
            captionText += `> *POWERED BY KAMRAN MD*`;

            // Send image back to WhatsApp layout stream
            return await conn.sendMessage(from, { 
                image: { url: imageUrl }, 
                caption: captionText 
            }, { quoted: mek });

        } else {
            return reply(`❌ *Server Rejected:* ${data?.message || 'Pinterest API endpoint failed to respond properly.'}`);
        }

    } catch (error) {
        console.error(error);
        try {
            return reply(`❌ *Pinterest System Fail:* ${error.message}`);
        } catch (innerError) {
            console.error("Critical error crash during reply handling", innerError);
        }
    }
});
