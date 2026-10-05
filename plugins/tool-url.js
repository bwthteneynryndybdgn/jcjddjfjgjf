// ꜰᴀᴛɪᴍᴀ-ᴍᴅ

import axios from "axios";
import fs from 'fs';
import os from 'os';
import path from "path";
import { cmd } from "../command.js";
import { fileURLToPath } from 'url';
import { downloadContentFromMessage } from '@whiskeysockets/baileys';
import FormData from 'form-data';

const __filename = fileURLToPath(import.meta.url);

cmd({
  pattern: "tourl",
  alias: ["imgtourl", "imgurl", "url", "geturl", "upload"],
  react: '🖇',
  desc: "Convert media to URL with FATIMA-MD style",
  category: "utility",
  use: ".tourl [reply to media]",
  filename: __filename
}, async (conn, mek, m, { from, reply }) => {
  let tempFilePath = null;
  try {
    const quoted = m.msg?.contextInfo?.quotedMessage;
    
    if (!quoted) {
      return reply(
        `╔════════════════════════╗\n` +
        `║   🖇 KAMRAN-MD TOURL   🖇   \n` +
        `╚════════════════════════╝\n\n` +
        `❌ *Kripya kisi Image, Video, Audio ya File par reply karein!*\n\n` +
        `> ⚡ *Version:* \`12.00\``
      );
    }

    await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

    let type = Object.keys(quoted)[0];
    let content = quoted[type];
    
    const stream = await downloadContentFromMessage(content, type.replace('Message', '').toLowerCase());
    let buffer = Buffer.from([]);
    for await (const chunk of stream) {
      buffer = Buffer.concat([buffer, chunk]);
    }

    if (!buffer || buffer.length === 0) {
      await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
      return reply("❌ *Media download karne me asamarth! Buffer khali hai.*");
    }

    const mimeType = content.mimetype || 'image/jpeg';

    let extension = '.jpg';
    if (mimeType.includes('png')) extension = '.png';
    else if (mimeType.includes('webp')) extension = '.webp';
    else if (mimeType.includes('video')) extension = '.mp4';
    else if (mimeType.includes('audio')) extension = '.mp3';
    else if (mimeType.includes('zip')) extension = '.zip';
    else if (mimeType.includes('pdf')) extension = '.pdf';
    
    tempFilePath = path.join(os.tmpdir(), `upload_${Date.now()}${extension}`);
    fs.writeFileSync(tempFilePath, buffer);

    let mediaUrl = '';

    // Upload using Telegra.ph API (Fast & Never gives 412 error)
    try {
      const form = new FormData();
      form.append('file', fs.createReadStream(tempFilePath));

      const response = await axios.post("https://telegra.ph/upload", form, {
        headers: {
          ...form.getHeaders(),
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        },
        timeout: 60000
      });

      if (response.data && response.data[0] && response.data[0].src) {
        mediaUrl = "https://telegra.ph" + response.data[0].src;
      }
    } catch (err) {
      console.error("Telegraph upload error, trying ImgBB...", err);
    }

    // Fallback to ImgBB if telegraph fails
    if (!mediaUrl) {
      try {
        const base64Data = buffer.toString('base64');
        const imgbbForm = new FormData();
        imgbbForm.append('key', 'e4b536bbf102cfccc5d8758489052547');
        imgbbForm.append('image', base64Data);

        const imgbbRes = await axios.post('https://api.imgbb.com/1/upload', imgbbForm, {
          headers: imgbbForm.getHeaders(),
          timeout: 30000
        });

        if (imgbbRes.data && imgbbRes.data.success) {
          mediaUrl = imgbbRes.data.data.url;
        }
      } catch (imgbbErr) {
        console.error("ImgBB upload error:", imgbbErr);
      }
    }

    if (!mediaUrl) {
      throw new Error("Dono upload servers par request fail ho gayi.");
    }

    if (tempFilePath && fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }

    let mediaType = 'File';
    if (mimeType.includes('image')) mediaType = 'Image';
    else if (mimeType.includes('video')) mediaType = 'Video';
    else if (mimeType.includes('audio')) mediaType = 'Audio';
    else if (mimeType.includes('document')) mediaType = 'Document';

    const uploadBox = `
╔════════════════════════╗
║   🖇 KAMI-MD TOURL   🖇   
╚════════════════════════╝
 📦 *Type:* \`${mediaType}\`
 📊 *Size:* \`${formatBytes(buffer.length)}\`
 🔗 *URL:* ${mediaUrl}
━━━━━━━━━━━━━━━━━━━━━━━━━━
> ⚡ *Version:* \`10.00\`
> 👑 *Powered by KAMI-MD*`.trim();

    await reply(uploadBox, {
      contextInfo: { 
        forwardingScore: 999, 
        isForwarded: true, 
        forwardedNewsletterMessageInfo: { 
          newsletterJid: '120363418144382782@newsletter', 
          newsletterName: 'KAMI-MD', 
          serverMessageId: 143 
        } 
      }
    });

    await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

  } catch (error) {
    console.error("ToURL Error:", error);
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try { fs.unlinkSync(tempFilePath); } catch {}
    }
    await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
    await reply(`❌ *Error uploading media:* \`\`\`${error.message || error}\`\`\``);
  }
});

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
