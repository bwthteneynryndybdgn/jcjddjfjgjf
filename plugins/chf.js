//---------------------------------------------------------------------------
//           KAMRAN-MD - UPLOAD TO CHANNEL PLUGIN (FIXED)
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
async (client, message, match, { from, reply, isCreator, socket, sock, usedPrefix, command }) => {
    const conn = socket || sock || client;
    const chatId = from || message.chat;

    if (!isCreator) {
        return reply("*📛 This is an owner command.*");
    }

    // Check quoted message using bot wrapper & fallback
    const quoted = message.quoted || message.msg?.contextInfo?.quotedMessage;

    if (!quoted) {
        return reply(
            `❌ *Reply media terlebih dahulu!*\n\n` +
            `Contoh:\n${usedPrefix + command}`
        );
    }

    let type = '';
    let mimetype = '';
    let caption = message.quoted?.caption || message.quoted?.text || '';

    // Detect media type from bot wrapper or quoted object
    const mtype = message.quoted?.mtype || '';
    
    if (mtype === 'imageMessage' || quoted.imageMessage) {
        type = 'image';
        mimetype = message.quoted?.mimetype || quoted.imageMessage?.mimetype || 'image/jpeg';
        caption = message.quoted?.caption || quoted.imageMessage?.caption || '';
    } else if (mtype === 'videoMessage' || quoted.videoMessage) {
        const vMsg = quoted.videoMessage || {};
        type = vMsg.ptv ? 'ptv' : 'video';
        mimetype = message.quoted?.mimetype || vMsg.mimetype || 'video/mp4';
        caption = message.quoted?.caption || vMsg.caption || '';
    } else if (mtype === 'audioMessage' || quoted.audioMessage) {
        type = 'audio';
        mimetype = message.quoted?.mimetype || quoted.audioMessage?.mimetype || 'audio/mpeg';
    } else if (mtype === 'stickerMessage' || quoted.stickerMessage) {
        type = 'sticker';
        mimetype = 'image/webp';
    }

    if (!type) {
        return reply('❌ Media tidak didukung atau pastikan reply ke media!');
    }

    const ext = mimetype?.split('/')[1]?.split(';')[0] || 'bin';
    const filename = `${Date.now()}`;

    const inputPath = path.join(tmpdir(), `${filename}.${ext}`);
    const opusPath = path.join(tmpdir(), `${filename}.opus`);

    try {
        await reply(`🔄 Sedang memproses ${type}...`);

        let buffer;
        if (message.quoted && typeof message.quoted.download === 'function') {
            buffer = await message.quoted.download();
        } else {
            const stream = await downloadContentFromMessage(
                quoted.imageMessage || quoted.videoMessage || quoted.audioMessage || quoted.stickerMessage || quoted,
                type === 'image' ? 'image' :
                type === 'video' || type === 'ptv' ? 'video' :
                type === 'audio' ? 'audio' : 'sticker'
            );
            buffer = await streamToBuffer(stream);
        }

        fs.writeFileSync(inputPath, buffer);

        switch (type) {
            case 'image':
                await conn.sendMessage(CH_ID, {
                    image: fs.readFileSync(inputPath),
                    caption
                });
                break;

            case 'video':
                await conn.sendMessage(CH_ID, {
                    video: fs.readFileSync(inputPath),
                    caption
                });
                break;

            case 'ptv':
                await conn.sendMessage(CH_ID, {
                    video: fs.readFileSync(inputPath),
                    ptv: true,
                    caption
                });
                break;

            case 'sticker':
                await conn.sendMessage(CH_ID, {
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

                await conn.sendMessage(CH_ID, {
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
