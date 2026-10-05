import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { downloadContentFromMessage } from '@whiskeysockets/baileys';

const __filename = fileURLToPath(import.meta.url);

const CREATOR = 'KAMRAN-MD';
const BASE_URL = 'https://www.iloveimg.com/upscale-image';
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

async function upscaleImage(input, multiplier = 2) {
  if (!input) {
    throw new Error('Input image (path or Buffer) is required');
  }

  const scale = [2, 4].includes(Number(multiplier)) ? String(multiplier) : '2';

  const pageRes = await axios.get(BASE_URL, {
    headers: {
      'User-Agent': USER_AGENT
    },
    timeout: 15000
  });

  const html = pageRes.data;
  const matchConfig = html.match(/var ilovepdfConfig = ({[^;]+});/);
  if (!matchConfig) {
    throw new Error('Failed to extract iLoveIMG config token');
  }

  const config = JSON.parse(matchConfig[1]);
  const token = config.token;
  const serverName = config.servers && config.servers.length > 0
    ? config.servers[Math.floor(Math.random() * config.servers.length)]
    : 'api1g';

  const workerServer = `https://${serverName}.iloveimg.com`;

  let taskId = null;
  const taskIdx = html.indexOf('ilovepdfConfig.taskId = ');
  if (taskIdx !== -1) {
    const q1 = html.indexOf("\x27", taskIdx);
    const q2 = html.indexOf("\x27", q1 + 1);
    taskId = html.substring(q1 + 1, q2);
  }

  if (!taskId) {
    throw new Error('Failed to extract pre-generated taskId');
  }

  const headers = {
    'Authorization': `Bearer ${token}`,
    'User-Agent': USER_AGENT,
    'Origin': 'https://www.iloveimg.com',
    'Referer': 'https://www.iloveimg.com/'
  };

  let fileStream;
  let filename = 'image.jpg';

  if (typeof input === 'string') {
    if (!fs.existsSync(input)) {
      throw new Error(`File not found at path: ${input}`);
    }
    fileStream = fs.createReadStream(input);
    filename = path.basename(input);
  } else if (Buffer.isBuffer(input)) {
    fileStream = input;
  } else {
    throw new Error('Invalid input type. Expected file path string or Buffer');
  }

  const formUpload = new FormData();
  formUpload.append('task', taskId);
  formUpload.append('file', fileStream, { filename });

  const uploadRes = await axios.post(`${workerServer}/v1/upload`, formUpload, {
    headers: {
      ...headers,
      ...formUpload.getHeaders()
    },
    timeout: 30000
  });

  const serverFilename = uploadRes.data?.server_filename;
  if (!serverFilename) {
    throw new Error('Upload failed: server_filename not returned');
  }

  const formUpscale = new FormData();
  formUpscale.append('task', taskId);
  formUpscale.append('server_filename', serverFilename);
  formUpscale.append('scale', scale);

  const upscaleRes = await axios.post(`${workerServer}/v1/upscale`, formUpscale, {
    headers: {
      ...headers,
      ...formUpscale.getHeaders()
    },
    responseType: 'arraybuffer',
    timeout: 60000
  });

  const imageBuffer = Buffer.from(upscaleRes.data);

  return {
    status: true,
    creator: CREATOR,
    scale: `${scale}x`,
    sizeBytes: imageBuffer.length,
    sizeMB: (imageBuffer.length / (1024 * 1024)).toFixed(2),
    buffer: imageBuffer
  };
}

cmd({
    pattern: "remini",
    alias: ["enhance", "upscale", "hd", "unblur"],
    desc: "Upscale image using iLoveIMG",
    category: "tools",
    filename: __filename
},
async (conn, mek, m, { from, reply, text }) => {
    try {
        const quoted = m.msg?.contextInfo?.quotedMessage || m.quoted;
        
        if (!quoted) {
            return await reply('❌ Please reply to an image to upscale it!');
        }

        const mime = quoted.imageMessage?.mimetype || m.quoted?.mimetype || '';
        if (mime && !mime.includes('image')) {
            return await reply('❌ Please reply to a valid image file!');
        }

        const scaleMultiplier = text ? parseInt(text.trim()) : 2;
        const validScale = [2, 4].includes(scaleMultiplier) ? scaleMultiplier : 2;

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });
        await reply(`🚀 Processing upscale ${validScale}x, please wait...`);

        // Robust media buffer download
        let mediaBuffer;
        try {
            if (m.quoted && typeof m.quoted.download === 'function') {
                mediaBuffer = await m.quoted.download();
            } else {
                let type = Object.keys(quoted)[0];
                let content = quoted[type];
                const stream = await downloadContentFromMessage(content, type.replace('Message', '').toLowerCase());
                let chunks = [];
                for await (const chunk of stream) {
                    chunks.push(chunk);
                }
                mediaBuffer = Buffer.concat(chunks);
            }
        } catch (downloadErr) {
            console.error('Download error:', downloadErr);
        }

        if (!mediaBuffer || mediaBuffer.length === 0) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return await reply('❌ Media download karne me asamarth!');
        }

        const result = await upscaleImage(mediaBuffer, validScale);

        await conn.sendMessage(from, {
            image: result.buffer,
            caption: `✅ *Image Upscaled Successfully!*\n\n🔹 *Scale:* ${result.scale}\n📦 *Size:* ${result.sizeMB} MB\n👑 *Creator:* ${result.creator}`
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
        console.error('[UPSCALE ERROR]', e?.message || e);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } }).catch(() => {});
        return await reply('❌ Failed to upscale image: ' + (e?.message || e));
    }
});
