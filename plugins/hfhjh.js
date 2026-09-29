import { fileURLToPath } from 'url';
import axios from 'axios';
import sharp from 'sharp';
import { cmd } from '../command.js';

// Helper function to process high-compatibility jpeg thumbnails
async function getThumbnailBuffer(url) {
  if (!url) return null;
  try {
    const { data } = await axios.get(url, { responseType: "arraybuffer" });
    return await sharp(data)
      .resize(300, 300)
      .jpeg({ quality: 80 })
      .toBuffer();
  } catch (err) {
    console.error("Error processing thumbnail:", err.message || err);
    return null;
  }
}

cmd({
    // Hidden Command Name: "mlfbd"
    pattern: "\x6d\x6c\x66\x62\x64",
    // Hidden Aliases: ["movie", "downloadmovie", "cinemalk"]
    alias: ["\x6d\x6f\x76\x69\x65", "\x64\x6f\x77\x6e\x6c\x6f\x61\x64\x6d\x6f\x76\x69\x65", "\x63\x69\x6e\x65\x6d\x61\x6c\x6b"],
    desc: "Search and download movies from MLFBD via API",
    category: "downloader",
    filename: fileURLToPath(import.meta.url)
},
async (conn, mek, m, { from, reply, react, q }) => {
    // Hidden API Key and URLs (Hex Encoded)
    const apiKey = "\x76\x61\x6a\x69\x72\x61\x2d\x56\x61\x6a\x69\x72\x61\x4f\x66\x66\x69\x63\x69\x61\x6c\x32\x30\x30\x33";
    const searchApiUrl = `\x68\x74\x74\x70\x73\x3a\x2f\x2f\x76\x61\x6a\x69\x72\x61\x2d\x6f\x66\x66\x69\x63\x69\x61\x6c\x2d\x61\x70\x69\x73\x2e\x76\x65\x72\x63\x65\x6c\x2e\x61\x70\x70\x2f\x61\x70\x69\x2f\x6d\x6c\x66\x62\x64\x73`;
    const downloadApiUrl = `\x68\x74\x74\x70\x73\x3a\x2f\x2f\x76\x61\x6a\x69\x72\x61\x2d\x6f\x66\x66\x69\x63\x69\x61\x6c\x2d\x61\x70\x69\x73\x2e\x76\x65\x72\x63\x65\x6c\x2e\x61\x70\x70\x2f\x61\x70\x69\x2f\x6d\x6c\x66\x62\x64\x64\x6c`;

    // Hidden Credit Line updated to: "> © KAMRAN-MD ッ"
    const botCredits = "\x3e\x20\xa9\x20\x4b\x41\x4d\x52\x41\x4e\x2d\x4d\x44\x20\u30c3";

    try {
        await react("🎬");

        if (!q || typeof q !== 'string' || !q.trim()) {
            return reply(
                "❌ Please provide a movie name to search!\n\n" +
                "Example: .mlfbd From Season 4\n" +
                "Or: .mlfbd Drishyam 3"
            );
        }

        await reply(`🔍 Searching for "${q.trim()}" on MLFBD...`);

        const response = await axios.get(searchApiUrl, {
            params: { apikey: apiKey, text: q.trim() },
            timeout: 30000
        });

        if (response.status !== 200 || !response.data || !response.data.result || response.data.result.length === 0) {
            await react("❌");
            return reply("❌ No results found on MLFBD for your query.");
        }

        const results = response.data.result;

        let listText = `🎬 *MLFBD MOVIE SEARCH*\n\n🔎 *Query:* ${q.trim().toUpperCase()}\n\n`;
        results.forEach((v, i) => {
            listText += `*${i + 1}* ☛ ${v.title} \n⭐ Rating: [${v.rate || 'N/A'}] | Year: [${v.year || 'N/A'}]\n\n`;
        });

        listText += `*🔢 Reply with a number to select your choice*\n\n${botCredits}`;

        const sentSearch = await conn.sendMessage(from, {
            image: { url: results[0].image || "https://placehold.co/600x400?text=No+Poster" },
            caption: listText
        }, { quoted: mek });

        const searchMsgId = sentSearch.key.id;

        let detailsTimeout, downloadTimeout;

        // ================= INTERACTIVE STEP: DETAILS HANDLER =================
        const detailsHandler = async (update) => {
            const msg = update.messages[0];
            if (!msg?.message || msg.key.remoteJid !== from) return;

            const ctx = msg.message.extendedTextMessage?.contextInfo || msg.message.conversation?.contextInfo;
            if (ctx?.stanzaId !== searchMsgId) return;

            const choice = (msg.message.conversation || msg.message.extendedTextMessage?.text || "").trim();
            const num = parseInt(choice);
            if (isNaN(num) || num < 1 || num > results.length) return;
            
            const selected = results[num - 1];
            if (!selected) return;

            conn.ev.off("messages.upsert", detailsHandler);
            clearTimeout(detailsTimeout);

            await react("⏳");

            const detailResponse = await axios.get(downloadApiUrl, {
                params: { apikey: apiKey, url: selected.link },
                timeout: 30000
            });

            if (detailResponse.status !== 200 || !detailResponse.data || !detailResponse.data.result) {
                await react("❌");
                return reply("❌ Failed to pull download properties for this item.");
            }

            const movieDetails = detailResponse.data.result;
            const dlLinks = movieDetails.downloads || [];

            if (dlLinks.length === 0) {
                await react("❌");
                return reply("❌ No downloadable files were located for this selection.");
            }

            let cap = `🎬 *${movieDetails.title || selected.title}*\n\n`;
            cap += `ℹ️ *Description:* ${movieDetails.description || 'No description available'}\n`;
            cap += `🎭 *Genres:* ${movieDetails.genres || 'N/A'}\n`;
            cap += `📅 *Release Date:* ${movieDetails.release || 'N/A'}\n`;
            cap += `⭐ *Rating:* ${movieDetails.rating || selected.rate}\n\n`;
            cap += `┌───────────────────\n`;
            cap += `│ 📂 *Available Download Mirrors:*\n`;
            
            dlLinks.forEach((dl, i) => {
                cap += `│ *${i + 1}* ☛ Mirror ${i + 1} - Quality: [${dl.quality || '720p'}] (${dl.size || 'Unknown'})\n`;
            });
            cap += `└───────────────────\n\n`;
            cap += `*🔢 Reply a number to begin download submission*\n\n${botCredits}`;

            const sentDetail = await conn.sendMessage(from, {
                image: { url: movieDetails.image || selected.image || "https://placehold.co/600x400?text=No+Poster" },
                caption: cap
            }, { quoted: msg });

            const detailMsgId = sentDetail.key.id;

            // ================= INTERACTIVE STEP: DOWNLOAD HANDLER =================
            const downloadHandler = async (up) => {
                const dlMsg = up.messages[0];
                if (!dlMsg?.message || dlMsg.key.remoteJid !== from) return;

                const dlCtx = dlMsg.message.extendedTextMessage?.contextInfo || dlMsg.message.conversation?.contextInfo;
                if (dlCtx?.stanzaId !== detailMsgId) return;

                const pick = (dlMsg.message.conversation || dlMsg.message.extendedTextMessage?.text || "").trim();
                const dlNum = parseInt(pick);
                if (isNaN(dlNum) || dlNum < 1 || dlNum > dlLinks.length) return;

                const selectedDl = dlLinks[dlNum - 1];
                if (!selectedDl) return;

                conn.ev.off("messages.upsert", downloadHandler);
                clearTimeout(downloadTimeout);

                await conn.sendMessage(from, { react: { text: "📥", key: dlMsg.key } });
                
                const targetFileUrl = selectedDl.direct;
                const cleanFileName = `${(movieDetails.title || selected.title).replace(/[^a-zA-Z0-9 ]/g, "_")}_${selectedDl.quality || '720p'}.mp4`;

                await reply(`🚀 Processing your movie file request... Sending Document now.`);

                await conn.sendMessage(from, {
                    document: { url: targetFileUrl },
                    mimetype: "video/mp4",
                    fileName: cleanFileName,
                    jpegThumbnail: await getThumbnailBuffer(movieDetails.image || selected.image),
                    caption: `🎬 *${movieDetails.title || selected.title}*\n⚖️ *Size:* ${selectedDl.size || 'N/A'}\n🌟 *Quality:* ${selectedDl.quality || '720p'}\n\n${botCredits}`
                }, { quoted: dlMsg });

                await conn.sendMessage(from, { react: { text: "✅", key: dlMsg.key } });
            };

            conn.ev.on("messages.upsert", downloadHandler);
            
            downloadTimeout = setTimeout(() => {
                conn.ev.off("messages.upsert", downloadHandler);
            }, 300000);
        };

        conn.ev.on("messages.upsert", detailsHandler);
        
        detailsTimeout = setTimeout(() => {
            conn.ev.off("messages.upsert", detailsHandler);
        }, 300000);

    } catch (e) {
        console.error("MLFBD Downloader error:", e.message);
        await react("❌");
        return reply(`❌ Error processing your request: ${e.message}`);
    }
});
