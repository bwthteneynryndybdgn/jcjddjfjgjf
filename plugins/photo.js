import axios from 'axios';
import FormData from 'form-data';
import crypto from 'crypto';
import { cmd } from '../command.js'; // اپنے بوٹ کے کمانڈ ہینڈلر کا صحیح پاتھ رکھیں

const generateSerial = () => crypto.randomBytes(16).toString('hex');
const randomIP = () => Array.from({length: 4}, () => Math.floor(Math.random() * 256)).join('.');

// Core API Scraper Exported for ESM
export async function processImageByUrl(imageUrl, prompt) {
    const createUrl = 'https://api.photoeditorai.io/pe/photo-editor/create-job';
    const checkUrl = 'https://api.photoeditorai.io/pe/photo-editor/get-job/';
    
    const serial = generateSerial();
    const fakeIP = randomIP();

    const headers = {
        'Accept': 'application/json, text/plain, */*',
        'Origin': 'https://photoeditorai.io',
        'Product-Serial': serial,
        'Referer': 'https://photoeditorai.io/',
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36',
        'X-Forwarded-For': fakeIP
    };

    try {
        const imageStream = await axios.get(imageUrl, { responseType: 'stream' });

        const form = new FormData();
        form.append('model_name', 'photoeditor_4.0');
        form.append('target_images', imageStream.data, { filename: 'input.jpg' });
        form.append('prompt', prompt);
        form.append('ratio', 'match_input_image');
        form.append('image_resolution', '1K');

        const resCreate = await axios.post(createUrl, form, { 
            headers: { ...headers, ...form.getHeaders() } 
        });

        if (resCreate.data.code !== 100000) {
            throw new Error(resCreate.data.message || "Gagal membuat job");
        }

        const jobId = resCreate.data.result.job_id;

        let isDone = false;
        let attempts = 0;
        const maxAttempts = 40; // Timeout handling (~2 minutes max)

        while (!isDone && attempts < maxAttempts) {
            attempts++;
            const resCheck = await axios.get(checkUrl + jobId, { headers });
            const result = resCheck.data.result;

            if (result.status === 2 || result.status === "2") {
                return {
                    status: "success",
                    prompt: prompt,
                    original_url: imageUrl,
                    result_url: result.output[0]
                };
            } else if (result.error) {
                throw new Error(result.error);
            } else {
                await new Promise(resolve => setTimeout(resolve, 3000));
            }
        }

        throw new Error("Processing timeout exceeded");

    } catch (error) {
        return { 
            status: "error", 
            message: error.message 
        };
    }
}

// ==========================================
//          WHATSAPP BOT COMMAND
// ==========================================

cmd({
    pattern: "photoedit",
    alias: ["peai", "editphoto", "aiphoto"],
    desc: "Edit image using PhotoEditorAI with prompt",
    category: "ai",
    filename: import.meta.url
},
async (conn, mek, m, { q, reply, react }) => {
    try {
        const isQuotedImage = mek.quoted && (mek.quoted.type === 'imageMessage' || (mek.quoted.msg || mek.quoted).mimetype?.startsWith('image/'));
        const isImage = mek.type === 'imageMessage' || (mek.msg || mek).mimetype?.startsWith('image/');

        if (!isImage && !isQuotedImage) {
            await react("❌");
            return reply("⚠️ *براہ کرم کسی تصویر کے ساتھ یا اسے ریپلائی کر کے پرامپٹ لکھیں!*\n\n*مثال:* `.photoedit make background cyberpunk`");
        }

        if (!q) {
            await react("❌");
            return reply("⚠️ *براہ کرم تصویر کو ایڈٹ کرنے کا پرامپٹ لکھیں!*");
        }

        await react("🎨");
        await reply("⏳ *تصویر پروسیس کی جا رہی ہے، براہ کرم 10 سے 30 سیکنڈ انتظار کریں...*");

        // Download Image Buffer & Convert to temporary URL / Stream handling
        const targetMedia = isQuotedImage ? mek.quoted : mek;
        const imageBuffer = await targetMedia.download();

        // Upload buffer to temporary media server or process directly
        // (Using directly fetched image or temporary link generation for scraper compatibility)
        const formMedia = new FormData();
        formMedia.append("file", imageBuffer, { filename: "image.jpg" });

        const uploadRes = await axios.post("https://tmpfiles.org/api/v1/upload", formMedia, {
            headers: { ...formMedia.getHeaders() }
        });

        const rawUrl = uploadRes.data?.data?.url;
        if (!rawUrl) throw new Error("Gagal mengunggah gambar sementara");

        const directImageUrl = rawUrl.replace("tmpfiles.org/", "tmpfiles.org/dl/");

        // Call PhotoEditorAI Scraper
        const result = await processImageByUrl(directImageUrl, q);

        if (result.status !== "success" || !result.result_url) {
            await react("❌");
            return reply(`❌ *ایڈیٹنگ میں ناکامی ہوئی:* ${result.message}`);
        }

        // Send Result Image
        await conn.sendMessage(m.chat, {
            image: { url: result.result_url },
            caption: `🎨 *AI Photo Edited*\n📝 *Prompt:* ${q}`
        }, { quoted: mek });

        await react("✅");

    } catch (err) {
        console.error("PhotoEdit Command Error:", err);
        await react("❌");
        await reply(`❌ *Error:* ${err.message}`);
    }
});
