//---------------------------------------------------------------------------
//           KAMRAN-MD - UPLOAD TO CHANNEL PLUGIN (BAILEY'S FIXED)
//---------------------------------------------------------------------------

import fs from 'fs';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import { tmpdir } from 'os';
import { downloadContentFromMessage } from '@whiskeysockets/baileys';
import { cmd } from '../command.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);

const CH_ID = '120363414372628604@newsletter';

function streamToBuffer(stream) {
  return new Promise(async (resolve, reject) => {
    let buffer = Buffer.from([]);
    try {
      for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
      }
      resolve(buffer);
    } catch (e) {
      reject(e);
    }
  });
}

function convertToOpus(input, output) {
  return new Promise((resolve, reject) => {
    ffmpeg(input)
      .audioCodec('libopus')
      .audioBitrate('64k')
      .format('opus')
      .on('end', resolve)
      .on('error', reject)
      .save(output);
  });
}

cmd({
    pattern: "upch",
    alias: ["sendch"],
    desc: "Owner Only - Upload quoted media to WhatsApp Channel",
    category: "owner",
    filename: __filename
},
async (conn, mek, m, { from, reply, isCreator, socket, sock, usedPrefix, command }) => {
    const client = socket || sock || conn;
    const chatId = from || m.chat;

    if (!isCreator) {
        return reply("*📛 This is an owner command.*");
    }

    // Official Baileys Quoted Message Extractor
    const quoted = mek.msg?.contextInfo?.quotedMessage;

    if (!quoted) {
        return reply(
            `❌ *Reply media terlebih dahulu!*\n\n` +
            `Contoh:\n${usedPrefix + command}`
        );
    }

    let media = null;
    let type = '';
    let mimetype = '';
    let caption = '';

    if (quoted.imageMessage) {
        media = quoted.imageMessage;
        type = 'image';
        mimetype = media.mimetype;
        caption = quoted.imageMessage.caption || '';
    } else if (quoted.videoMessage) {
        media = quoted.videoMessage;
        type = media.ptv ? 'ptv' : 'video';
        mimetype = media.mimetype;
        caption = quoted.videoMessage.caption || '';
    } else if (quoted.audioMessage) {
        media = quoted.audioMessage;
        type = 'audio';
        mimetype = media.mimetype;
    } else if (quoted.stickerMessage) {
        media = quoted.stickerMessage;
        type = 'sticker';
        mimetype = 'image/webp';
    }

    if (!media) {
        return reply('❌ Media tidak didukung atau pastikan reply ke media!');
    }

    const ext = mimetype?.split('/')[1]?.split(';')[0] || 'bin';
    const filename = `${Date.now()}`;

    const inputPath = path.join(tmpdir(), `${filename}.${ext}`);
    const opusPath = path.join(tmpdir(), `${filename}.opus`);

    try {
        await reply(`🔄 Sedang memproses ${type}...`);

        const stream = await downloadContentFromMessage(
            media,
            type === 'image' ? 'image' :
            type === 'video' || type === 'ptv' ? 'video' :
            type === 'audio' ? 'audio' : 'sticker'
        );

        const buffer = await streamToBuffer(stream);
        fs.writeFileSync(inputPath, buffer);

        switch (type) {
            case 'image':
                await client.sendMessage(CH_ID, {
                    image: fs.readFileSync(inputPath),
                    caption
                });
                break;

            case 'video':
                await client.sendMessage(CH_ID, {
                    video: fs.readFileSync(inputPath),
                    caption
                });
                break;

            case 'ptv':
                await client.sendMessage(CH_ID, {
                    video: fs.readFileSync(inputPath),
                    ptv: true,
                    caption
                });
                break;

            case 'sticker':
                await client.sendMessage(CH_ID, {
                    sticker: fs.readFileSync(inputPath)
                });
                break;

            case 'audio': {
                const isOpus = mimetype.includes('opus') || mimetype.includes('ogg');

                if (isOpus) {
                    fs.copyFileSync(inputPath, opusPath);
                } else {
                    await convertToOpus(inputPath, opusPath);
                }

                await client.sendMessage(CH_ID, {
                    audio: fs.readFileSync(opusPath),
                    mimetype: 'audio/ogg; codecs=opus',
                    ptt: true
                });
                break;
            }
        }

        await reply(`✅ ${type} berhasil diupload ke channel!`);

    } catch (e) {
        console.error('[UPCH ERROR]', e);
        return reply(`❌ Error:\n\n${e.message || e}`);

    } finally {
        try {
            if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
        } catch {}

        try {
            if (fs.existsSync(opusPath)) fs.unlinkSync(opusPath);
        } catch {}
    }
});
