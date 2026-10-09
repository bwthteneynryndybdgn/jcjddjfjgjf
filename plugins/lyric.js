// plugins/song.js - ESM Version
import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import config from '../config.js';
import axios from 'axios';
import yts from 'yt-search';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "song1",
    alias: ["play1", "audio1", "ytmp31"],
    react: '🎧',
    desc: "Search and download songs with options (Audio, Document, Voice Note)",
    category: "downloader",
    filename: __filename
}, async (client, message, m, { 
    from, 
    prefix, 
    command, 
    args, 
    q, 
    isCreator,
    userConfig
}) => {
    try {
        const BOT_NAME = userConfig?.BOT_NAME || config.BOT_NAME || "𝙳𝙲𝚃 𝙽𝙸𝙽𝙹𝙰 𝚇 𝙼𝙳";

        let text = q || (args ? args.join(' ') : '').trim();

        if (!text) {
            return await client.sendMessage(from, {
                text: "❌ *Give me a song name!*"
            }, { quoted: message });
        }

        // 🎯 reaction
        await client.sendMessage(from, {
            react: { text: '🎧', key: message.key }
        });

        // =========================
        // 🔎 SEARCH VIA YT-SEARCH (Reliable)
        // =========================
        const searchResults = await yts(text);
        const videos = searchResults?.videos || searchResults?.all;

        if (!videos || videos.length === 0) {
            return await client.sendMessage(from, {
                text: "❌ Song not found!"
            }, { quoted: message });
        }

        const video = videos[0];
        const videoUrl = video.url;

        // =========================
        // UI MESSAGE
        // =========================
        const caption = `
╭───「 🎧 ${BOT_NAME} 」───◆
│
│ 🎵 Title : ${video.title}
│ ⏱️ Duration : ${video.timestamp}
│ 👁️ Views : ${video.views}
│
╰────────────────────◆

👉 Reply OR click button:
1️⃣ AUDIO
2️⃣ DOCUMENT
3️⃣ VOICE
`.trim();

        // =========================
        // SEND BUTTON MESSAGE
        // =========================
        await client.sendMessage(from, {
            image: { url: video.thumbnail },
            caption,
            footer: BOT_NAME,
            buttons: [
                { buttonId: "song_audio", buttonText: { displayText: "🎧 AUDIO" }, type: 1 },
                { buttonId: "song_doc", buttonText: { displayText: "📂 DOCUMENT" }, type: 1 },
                { buttonId: "song_ptt", buttonText: { displayText: "🎤 VOICE" }, type: 1 }
            ],
            headerType: 4
        }, { quoted: message });

        // =========================
        // LISTENER (BUTTON + NUMBER)
        // =========================
        const handler = async ({ messages }) => {
            const incomingMsg = messages[0];
            if (!incomingMsg?.message) return;

            if (incomingMsg.key.remoteJid !== from) return;

            let id =
                incomingMsg.message?.buttonsResponseMessage?.selectedButtonId ||
                incomingMsg.message?.templateButtonReplyMessage?.selectedId ||
                incomingMsg.message?.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson;

            // parse interactive
            if (!id && typeof id === "string") {
                try {
                    id = JSON.parse(id)?.id;
                } catch {}
            }

            // number support
            const textMsg =
                incomingMsg.message?.conversation ||
                incomingMsg.message?.extendedTextMessage?.text ||
                "";

            if (!id && textMsg) {
                if (textMsg.trim() === "1") id = "song_audio";
                if (textMsg.trim() === "2") id = "song_doc";
                if (textMsg.trim() === "3") id = "song_ptt";
            }

            if (!id) return;

            let type = null;
            if (id === "song_audio") type = "audio";
            if (id === "song_doc") type = "doc";
            if (id === "song_ptt") type = "ptt";

            if (!type) return;

            client.ev.off("messages.upsert", handler);

            await client.sendMessage(from, {
                react: { text: '⬇️', key: incomingMsg.key }
            });

            try {
                // =========================
                // 🎧 DOWNLOAD API
                // =========================
                const dlApi = `https://www.movanest.xyz/v2/ytdl2?input=${encodeURIComponent(videoUrl)}&format=audio&bitrate=128`;

                const dlRes = await axios.get(dlApi);
                const downloadUrl = dlRes.data?.result?.download_url || dlRes.data?.download_url;

                if (!downloadUrl) throw new Error("Download URL not found");

                const audioBuffer = await axios.get(downloadUrl, {
                    responseType: "arraybuffer"
                });

                const buffer = Buffer.from(audioBuffer.data);

                // =========================
                // SEND MEDIA
                // =========================
                if (type === "doc") {
                    await client.sendMessage(from, {
                        document: buffer,
                        mimetype: "audio/mpeg",
                        fileName: `${video.title.replace(/[^\w\s-]/g, '')}.mp3`,
                        caption: `🎧 ${video.title}`
                    }, { quoted: incomingMsg });

                } else if (type === "ptt") {
                    await client.sendMessage(from, {
                        audio: buffer,
                        mimetype: "audio/mpeg",
                        ptt: true
                    }, { quoted: incomingMsg });

                } else {
                    await client.sendMessage(from, {
                        audio: buffer,
                        mimetype: "audio/mpeg"
                    }, { quoted: incomingMsg });
                }

                await client.sendMessage(from, {
                    react: { text: '✅', key: incomingMsg.key }
                });

            } catch (err) {
                console.log(err);
                await client.sendMessage(from, {
                    text: "❌ Download failed!"
                }, { quoted: incomingMsg });
            }
        };

        client.ev.on("messages.upsert", handler);

    } catch (e) {
        console.log(e);
        await client.sendMessage(from, {
            text: "❌ System error"
        }, { quoted: message });
    }
});
