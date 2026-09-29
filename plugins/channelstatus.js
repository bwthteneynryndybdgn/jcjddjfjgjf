import { cmd } from "../command.js";
import config from "../config.js";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);

cmd({
  pattern: "vvaudio",
  alias: ["vvmp3", 'retrivemp3'],
  react: '🐳',
  desc: "Owner Only - retrieve quoted message back to user",
  category: "owner",
  filename: __filename
}, async (client, message, match, { from, isCreator, userConfig }) => {
  try {
    if (!isCreator) {
      return await client.sendMessage(from, {
        text: "*📛 This is an owner command.*"
      }, { quoted: message });
    }

    if (!match.quoted) {
      return await client.sendMessage(from, {
        text: "*🍁 Please reply to a view once message!*"
      }, { quoted: message });
    }

    // Safely get the quoted message object (handling viewOnce wrappers)
    const quotedMsg = match.quoted;
    const buffer = await quotedMsg.download().catch(async () => {
      // Fallback if direct download fails due to wrapper structure
      return await client.downloadMediaMessage(quotedMsg);
    });

    const mtype = quotedMsg.mtype;
    const originalCaption = quotedMsg.text || quotedMsg.caption || '';
    const options = { quoted: message };

    const DESCRIPTION = userConfig?.DESCRIPTION || config.DESCRIPTION;

    let messageContent = {};
    switch (mtype) {
      case "imageMessage":
        messageContent = {
          image: buffer,
          caption: originalCaption ? `${originalCaption}\n\n> ${DESCRIPTION}` : `> ${DESCRIPTION}`,
          mimetype: quotedMsg.mimetype || "image/jpeg"
        };
        break;
      case "videoMessage":
        messageContent = {
          video: buffer,
          caption: originalCaption ? `${originalCaption}\n\n> ${DESCRIPTION}` : `> ${DESCRIPTION}`,
          mimetype: quotedMsg.mimetype || "video/mp4"
        };
        break;
      case "audioMessage":
        messageContent = {
          audio: buffer,
          mimetype: "audio/mp4",
          ptt: false // Forces audio to send as normal audio file instead of voice note
        };
        break;
      default:
        return await client.sendMessage(from, {
          text: "❌ Only image, video, and audio messages are supported"
        }, { quoted: message });
    }

    await client.sendMessage(from, messageContent, options);
  } catch (error) {
    console.error("vv Error:", error);
    await client.sendMessage(from, {
      text: "❌ Error fetching vv message:\n" + error.message
    }, { quoted: message });
  }
});

cmd({
  pattern: "vv5",
  alias: ["wah", "ohh", "oho", "🙂", "😂", "❤️", "💋", "🥵", "🌚", "😒", "nice", "ok"],
  desc: "Owner Only - retrieve quoted message back to user",
  category: "owner",
  filename: __filename
}, async (client, message, match, { from, isCreator, userConfig }) => {
  try {
    if (!isCreator) {
      return; 
    }

    if (!match.quoted) {
      return await client.sendMessage(from, {
        text: "*🍁 Please reply to a view once message!*"
      }, { quoted: message });
    }

    const quotedMsg = match.quoted;
    const buffer = await quotedMsg.download().catch(async () => {
      return await client.downloadMediaMessage(quotedMsg);
    });

    const mtype = quotedMsg.mtype;
    const originalCaption = quotedMsg.text || quotedMsg.caption || '';
    const options = { quoted: message };

    const DESCRIPTION = userConfig?.DESCRIPTION || config.DESCRIPTION;

    let messageContent = {};
    switch (mtype) {
      case "imageMessage":
        messageContent = {
          image: buffer,
          caption: originalCaption ? `${originalCaption}\n\n> ${DESCRIPTION}` : `> ${DESCRIPTION}`,
          mimetype: quotedMsg.mimetype || "image/jpeg"
        };
        break;
      case "videoMessage":
        messageContent = {
          video: buffer,
          caption: originalCaption ? `${originalCaption}\n\n> ${DESCRIPTION}` : `> ${DESCRIPTION}`,
          mimetype: quotedMsg.mimetype || "video/mp4"
        };
        break;
      case "audioMessage":
        messageContent = {
          audio: buffer,
          mimetype: "audio/mp4",
          ptt: false // Forces audio to send as normal audio file instead of voice note
        };
        break;
      default:
        return await client.sendMessage(from, {
          text: "❌ Only image, video, and audio messages are supported"
        }, { quoted: message });
    }

    await client.sendMessage(message.sender, messageContent, options);
  } catch (error) {
    console.error("vv Error:", error);
    await client.sendMessage(from, {
      text: "❌ Error fetching vv message:\n" + error.message
    }, { quoted: message });
  }
});
