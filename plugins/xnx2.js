import { fileURLToPath } from 'url';
import axios from 'axios';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);

// Temporary cache memory chat ID ke mutabiq links yaad rakhne ke liye
if (!global.xnxxCache) global.xnxxCache = {};

cmd({
    pattern: "xnxx2",
    alias: ["xnxxdl2", "xnxxdown", "xnxxsearch"],
    desc: "Search and download videos in one command.",
    category: "download",
    filename: __filename
},
async (conn, mek, m, { from, quoted, body, args, q, reply }) => {
    try {
        if (!q) {
            return reply("❌ Please provide a query, number, or link!\n\n*💡 Usage Examples:*\n🔹 For Search: `.xnxx hot romance`\n🔹 For Download via Number: `.xnxx 1`\n🔹 For Direct Link: `.xnxx https://...`");
        }

        // 1. Check if the input is a Direct URL
        const isUrl = q.startsWith("http://") || q.startsWith("https://");
        
        // 2. Check if the input is a Selection Number (1-10)
        const isNumber = !isNaN(q) && parseInt(q) > 0 && parseInt(q) <= 10;

        if (isUrl) {
            // ------ DIRECT DOWNLOAD FLOW ------
            await reply("⏳ Link detected! Fetching video, please wait...");
            return await handleDownload(q, conn, from, mek, reply);
        } 
        
        else if (isNumber) {
            // ------ NUMBER SELECTION FLOW ------
            const index = parseInt(q) - 1;
            
            // Check if cache exists for this chat
            if (!global.xnxxCache[from] || !global.xnxxCache[from][index]) {
                return reply("❌ Session expired or invalid number. Please search again first using `.xnxx [query]`");
            }

            const selectedUrl = global.xnxxCache[from][index];
            await reply(`⏳ Fetching video choice *#${q}*, please wait...`);
            return await handleDownload(selectedUrl, conn, from, mek, reply);
        } 
        
        else {
            // ------ SEARCH FLOW ------
            await reply(`⏳ Searching for "${q}"...`);
            
            const searchUrl = `https://api.princetechn.com/api/search/xvideossearch?apikey=prince&query=${encodeURIComponent(q)}`;
            const response = await axios.get(searchUrl);
            
            // FIX 1: Forcefully parsing string to JSON if API doesn't send correct headers
            let data = response.data;
            if (typeof data === 'string') {
                try {
                    data = JSON.parse(data);
                } catch (e) {
                    return reply("❌ Failed to parse API response. Server might be sending invalid data.");
                }
            }

            // FIX 2: Matching exact structure from your screenshot (1000255654.jpg)
            let results = [];
            if (data && Array.isArray(data.results)) {
                results = data.results;
            } else if (data && Array.isArray(data.result)) {
                results = data.result;
            } else if (Array.isArray(data)) {
                results = data;
            }

            if (!results || results.length === 0) {
                return reply("❌ No results found for your search query.");
            }

            // Resetting and saving search results URLs in global cache for this chat
            global.xnxxCache[from] = [];

            let responseText = `🎬 *XNXX SEARCH RESULTS* 🎬\n\n`;
            responseText += `🔍 *Query:* _${q}_\n\n`;

            // Max 10 results list
            const maxResults = Math.min(results.length, 10);
            
            for (let i = 0; i < maxResults; i++) {
                let video = results[i];
                let title = video.title || "No Title";
                let duration = video.duration || "Unknown";
                
                // FIX 3: Targetting video.link as per your API response screenshot
                let videoLink = video.link || video.url;

                if (videoLink) {
                    global.xnxxCache[from].push(videoLink); // Saving link to cache
                    
                    responseText += `*${i + 1}.* ${title}\n`;
                    responseText += `⏱️ *Duration:* ${duration}\n`;
                    responseText += `───────────────────\n`;
                }
            }

            responseText += `\n💡 *How to download:* Reply to this message with \`.xnxx 1\` to get the first video, \`.xnxx 2\` for the second, etc.\n\n> Powered by KAMRAN MD`;

            return await conn.sendMessage(from, { text: responseText }, { quoted: mek });
        }

    } catch (error) {
        console.error(error);
        return reply(`❌ An error occurred: ${error.message}`);
    }
});

// Helper reusable function to process the download API
async function handleDownload(videoUrl, conn, from, mek, reply) {
    try {
        const downloadApi = `https://api.princetechn.com/api/download/xnxxdl?apikey=prince&url=${encodeURIComponent(videoUrl)}`;
        const response = await axios.get(downloadApi);
        
        let data = response.data;
        if (typeof data === 'string') {
            data = JSON.parse(data);
        }

        if (!data || data.success !== true || !data.result) {
            return reply("❌ Download failed. The API server returned an error or link is broken.");
        }

        const videoInfo = data.result;
        const title = videoInfo.title || "Downloaded Video";
        const duration = videoInfo.duration ? `${videoInfo.duration} seconds` : "Unknown";
        
        // Pick High resolution if available, otherwise Low fallback
        const finalDownloadLink = videoInfo.files?.high || videoInfo.files?.low;

        if (!finalDownloadLink) {
            return reply("❌ Media stream link not found in the API response.");
        }

        let captionText = `🎬 *XNXX DOWNLOADER* 🎬\n\n`;
        captionText += `📌 *Title:* ${title}\n`;
        captionText += `⏱️ *Duration:* ${duration}\n\n`;
        captionText += `> *Powered by KAMRAN MD*`;

        // Send direct video file
        return await conn.sendMessage(from, { 
            video: { url: finalDownloadLink }, 
            caption: captionText 
        }, { quoted: mek });

    } catch (err) {
        console.error(err);
        return reply(`❌ Media download error: ${err.message}`);
    }
}
