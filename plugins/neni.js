import { fileURLToPath } from 'url';
import axios from 'axios';
import { cmd } from '../command.js';

cmd({
    pattern: "pinterest",
    alias: ["pin", "pinterestsearch", "pindl"],
    desc: "Search and download multiple images from Pinterest.",
    category: "search",
    filename: fileURLToPath(import.meta.url)
},
async (conn, mek, m, { from, quoted, q, reply }) => {
    try {
        // Validation check
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
        
        // Safe JSON parsing
        if (typeof data === 'string') {
            try {
                data = JSON.parse(data);
            } catch (e) {
                return reply("❌ *Server Error:* Invalid JSON data format received.");
            }
        }

        // Check response status
        if (response.status !== 200 || !(data?.status === true || data?.status === 200)) {
            return reply(`❌ *Server Rejected:* ${data?.message || 'Pinterest API failed to respond.'}`);
        }

        const results = data.result;

        if (!results || (Array.isArray(results) && results.length === 0)) {
            return reply("❌ No images found matching your search query.");
        }

        // Normalize results into an array of image URLs
        let imageUrls = [];
        if (Array.isArray(results)) {
            imageUrls = results.map(item => {
                if (typeof item === 'string') return item;
                if (typeof item === 'object' && item !== null) {
                    return item.url || item.image || item.link || item.downloadUrl;
                }
                return null;
            }).filter(url => url);
        } else if (typeof results === 'string') {
            imageUrls.push(results);
        }

        if (imageUrls.length === 0) {
            return reply("❌ Failed to extract any valid image streams from the server array.");
        }

        // Randomize images to give fresh output every time
        imageUrls.sort(() => Math.random() - 0.5);

        // Limit to top 5 images maximum
        const imagesToDeliver = imageUrls.slice(0, 5);
        
        // Loop and send the images
        for (let i = 0; i < imagesToDeliver.length; i++) {
            let captionText = "";
            
            if (i === 0) {
                captionText = `📌 *PINTEREST IMAGE FINDER* 📌\n\n` +
                              `🔍 *Query:* ${q.trim()}\n` +
                              `📊 *Total Found:* ${imageUrls.length} images available\n` +
                              `✨ *Delivering:* Top ${imagesToDeliver.length} matching results\n\n` +
                              `*POWERED BY DR KAMRAN*`;
            } else {
                captionText = `✨ *Result (${i + 1}/${imagesToDeliver.length})*`;
            }

            await conn.sendMessage(from, { 
                image: { url: imagesToDeliver[i] }, 
                caption: captionText 
            }, { quoted: mek });
        }

    } catch (error) {
        console.error("Pinterest Command Error:", error);
        return reply(`❌ *Pinterest System Fail:* ${error.message}`);
    }
});
