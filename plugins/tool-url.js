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
  desc: "Convert media to Catbox URL with FATIMA-MD style",
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
        `║   🖇 FATIMA-MD TOURL   🖇   \n` +
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
    
    tempFilePath = path.join(os.tmpdir(), `catbox_${Date.now()}${extension}`);
    fs.writeFileSync(tempFilePath, buffer);

    const form = new FormData();
    form.append('reqtype', 'fileupload');
    form.append('fileToUpload', fs.createReadStream(tempFilePath));

    const response = await axios.post("https://catbox.moe/user/api.php", form, {
      headers: {
        ...form.getHeaders(),
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      },
      timeout: 60000
    });

    if (!response.data) {
      throw new Error("Catbox server se response nahi mila.");
    }

    const mediaUrl = response.data.trim();
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
║   🖇 FATIMA-MD TOURL   🖇   
╚════════════════════════╝
 📦 *Type:* \`${mediaType}\`
 📊 *Size:* \`${formatBytes(buffer.length)}\`
 🔗 *URL:* ${mediaUrl}
━━━━━━━━━━━━━━━━━━━━━━━━━━
> ⚡ *Version:* \`12.00\`
> 👑 *Powered by ꜰᴀᴛɪᴍᴀ-ᴍᴅ*`.trim();

    await reply(uploadBox, {
      contextInfo: { 
        forwardingScore: 999, 
        isForwarded: true, 
        forwardedNewsletterMessageInfo: { 
          newsletterJid: '120363412031212190@newsletter', 
          newsletterName: 'ꜰᴀᴛɪᴍᴀ-ᴍᴅ ᴏғғɪᴄɪᴀʟ', 
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
