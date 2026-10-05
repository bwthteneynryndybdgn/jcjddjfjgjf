// ꜰᴀᴛɪᴍᴀ-ᴍᴅ

import axios from "axios";
import FormData from 'form-data';
import fs from 'fs';
import os from 'os';
import path from "path";
import { cmd } from "../command.js";
import { fileURLToPath } from 'url';

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
    const quotedMsg = m.quoted || m.msg?.contextInfo?.quotedMessage;
    
    if (!quotedMsg) {
      return reply(
        `╔════════════════════════╗\n` +
        `║   🖇 FATIMA-MD TOURL   🖇   \n` +
        `╚════════════════════════╝\n\n` +
        `❌ *Kripya kisi Image, Video, Audio ya File par reply karein!*\n\n` +
        `> ⚡ *Version:* \`12.00\``
      );
    }

    await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

    // Media buffer download karne ke liye robust tareeqa
    let mediaBuffer;
    try {
      if (typeof m.quoted?.download === 'function') {
        mediaBuffer = await m.quoted.download();
      } else if (typeof conn.downloadAndSaveMediaMessage === 'function') {
        const streamPath = await conn.downloadAndSaveMediaMessage(quotedMsg, 'temp_media');
        mediaBuffer = fs.readFileSync(streamPath);
        try { fs.unlinkSync(streamPath); } catch {}
      } else {
        const type = Object.keys(quotedMsg)[0];
        const stream = await conn.downloadContentFromMessage(quotedMsg[type], type.replace('Message', '').toLowerCase());
        let chunks = [];
        for await (const chunk of stream) {
          chunks.push(chunk);
        }
        mediaBuffer = Buffer.concat(chunks);
      }
    } catch (downloadErr) {
      console.error('Buffer download error:', downloadErr);
    }

    if (!mediaBuffer || mediaBuffer.length === 0) {
      await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
      return reply("❌ *Media download karne me asamarth! Kripya dobara koshish karein.*");
    }

    const mimeType = quotedMsg.imageMessage?.mimetype ||
                     quotedMsg.videoMessage?.mimetype ||
                     quotedMsg.audioMessage?.mimetype ||
                     quotedMsg.documentMessage?.mimetype ||
                     quotedMsg.stickerMessage?.mimetype || '';

    tempFilePath = path.join(os.tmpdir(), `catbox_upload_${Date.now()}`);
    fs.writeFileSync(tempFilePath, mediaBuffer);

    let extension = '';
    if (mimeType.includes('image/jpeg')) extension = '.jpg';
    else if (mimeType.includes('image/png')) extension = '.png';
    else if (mimeType.includes('image/webp')) extension = '.webp';
    else if (mimeType.includes('video')) extension = '.mp4';
    else if (mimeType.includes('audio/mpeg')) extension = '.mp3';
    else if (mimeType.includes('audio/mp4') || mimeType.includes('audio/x-m4a')) extension = '.m4a';
    else if (mimeType.includes('application/zip')) extension = '.zip';
    else if (mimeType.includes('text/javascript')) extension = '.js';
    else if (mimeType.includes('audio/')) extension = '.audio';
    else if (mimeType.includes('image/')) extension = '.image';
    else if (mimeType.includes('text/')) extension = '.txt';
    else extension = '.file';
    
    const fileName = `file${extension}`;

    const form = new FormData();
    form.append('fileToUpload', fs.createReadStream(tempFilePath), fileName);
    form.append('reqtype', 'fileupload');

    const response = await axios.post("https://catbox.moe/user/api.php", form, {
      headers: form.getHeaders(),
      timeout: 60000
    });

    if (!response.data) {
      throw new Error("Error uploading to Catbox server");
    }

    const mediaUrl = response.data.trim();
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }

    let mediaType = 'File';
    if (mimeType.includes('image')) mediaType = 'Image';
    else if (mimeType.includes('video')) mediaType = 'Video';
    else if (mimeType.includes('audio')) mediaType = 'Audio';
    else if (mimeType.includes('application/zip')) mediaType = 'ZIP Archive';

    const uploadBox = `
╔════════════════════════╗
║   🖇 FATIMA-MD TOURL   🖇   
╚════════════════════════╝
 📦 *Type:* \`${mediaType}\`
 📊 *Size:* \`${formatBytes(mediaBuffer.length)}\`
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
