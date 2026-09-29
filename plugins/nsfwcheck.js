import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);

async function uguu(filePath) {
  const form = new FormData();
  form.append('files[]', fs.createReadStream(filePath));
  const { data } = await axios.post('https://uguu.se/upload', form, {
    headers: { ...form.getHeaders() }
  });
  return data.files[0].url;
}

cmd({
    pattern: "nsfwcheck",
    alias: [],
    desc: "Check if an image contains NSFW content using AI",
    category: "ai",
    react: "✨",
    filename: __filename,
    limit: true
},
async (conn, mek, m, { from, reply }) => {
    let tempFile = null;
    try {
        let q = m.quoted ? await m.getQuotedObj() : m;

        if (q.mtype !== 'imageMessage') {
            return reply('Kirim atau reply gambar lalu ketik *.nsfwcheck*');
        }

        // ⏳ React - processing
        await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });
        await new Promise(resolve => setTimeout(resolve, 1000));

        let buffer = await q.download();
        if (!buffer) {
            await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
            return reply('Gagal mendownload media.');
        }

        tempFile = path.join(process.cwd(), `nsfw_${Date.now()}.jpg`);
        fs.writeFileSync(tempFile, buffer);

        let srcUrl = await uguu(tempFile);

        const { data } = await axios.get(
            `${global.APIs.deline}/ai/nsfwcheck?url=${encodeURIComponent(srcUrl)}`
        );

        let caption = `✨ *NSFW Check Result*\n\n`;
        caption += `✨ Label : *${data.result.labelName}*\n`;
        caption += `✨ Confidence : *${(data.result.confidence * 100).toFixed(2)}%*`;

        await reply(caption);

        // 800ms delay before success react
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // ✅ React - success
        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });

    } catch (e) {
        console.error("Error in nsfwcheck command:", e);
        // ❌ React - error
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
        await reply(`❌ Error checking NSFW: ${e.message}`);
    } finally {
        if (tempFile && fs.existsSync(tempFile)) {
            fs.unlinkSync(tempFile);
        }
    }
});
