// KAMRAN MD - Universal Channel Forwarder (Media + Text)

import { fileURLToPath } from 'url';
import { generateWAMessageFromContent, downloadMediaMessage } from '@whiskeysockets/baileys';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);

cmd({
  pattern: "cforward",
  alias: ["cfwd", "chanfwd"],
  desc: "Forward Text, Photo, Video, Audio to WhatsApp Channels",
  category: "owner",
  filename: __filename
}, async (client, message, match, { isCreator, reply, from }) => {
  try {
    // Owner check
    if (!isCreator) return await reply("*📛 Owner Only Command*");
    
    // Quoted message check
    if (!message.quoted) return await reply("*🍁 Please reply to a message to forward*");

    // Handle match input
    let jidInput = "";
    if (typeof match === "string") {
      jidInput = match.trim();
    } else if (Array.isArray(match)) {
      jidInput = match.join(" ").trim();
    } else if (match && typeof match === "object") {
      jidInput = match.text || "";
    }
    
    if (!jidInput) {
      return await reply(
        "*🍁 Usage:* `.cforward channel_id1,channel_id2,...`\n" +
        "*Example:* `.cforward 120363xxx...@newsletter`\n" +
        "Reply to a Text, Photo, Video or Audio message!"
      );
    }

    // Process JIDs
    const rawJids = jidInput.split(',').map(jid => jid.trim()).filter(jid => jid);
    
    const validJids = rawJids
      .map(jid => {
        if (jid.includes('@newsletter')) {
          const numbers = jid.match(/\d+/g);
          if (!numbers || numbers.length === 0) return null;
          return `${numbers.join('')}@newsletter`;
        } 
        else if (/^\d+$/.test(jid)) {
          return `${jid}@newsletter`;
        }
        return null;
      })
      .filter(jid => jid !== null)
      .slice(0, 50);

    if (validJids.length === 0) {
      return await reply("❌ No valid Channel JIDs found.");
    }

    const uniqueJids = [...new Set(validJids)];
    
    await reply(`🔄 Processing Media/Text for ${uniqueJids.length} Channels...`);

    let successCount = 0;
    const failedJids = [];

    // Detect Message Type
    const mtype = Object.keys(message.quoted.message)[0];
    const isMedia = ['imageMessage', 'videoMessage', 'audioMessage', 'documentMessage'].includes(mtype);
    
    let mediaBuffer = null;
    let mediaMimeType = '';

    // If it's media, download it first
    if (isMedia) {
      try {
        await reply("📥 Downloading media...");
        mediaBuffer = await downloadMediaMessage(
          message.quoted,
          'buffer',
          {},
          { logger: console, reuploadRequest: client.updateMediaMessage }
        );
        
        // Get mime type based on message type
        if (mtype === 'imageMessage') mediaMimeType = 'image/jpeg';
        else if (mtype === 'videoMessage') mediaMimeType = 'video/mp4';
        else if (mtype === 'audioMessage') mediaMimeType = 'audio/mpeg';
        else if (mtype === 'documentMessage') mediaMimeType = message.quoted.message.document.mimetype || 'application/octet-stream';
        
      } catch (err) {
        return await reply("❌ Failed to download media. It might be expired or too large.");
      }
    }

    // Forward loop
    for (const [index, jid] of uniqueJids.entries()) {
      try {
        let msgContent = {};

        if (isMedia && mediaBuffer) {
          // Construct Media Message manually to ensure it sends correctly
          if (mtype === 'imageMessage') {
            msgContent = {
              image: mediaBuffer,
              caption: message.quoted.message.imageMessage.caption || '',
              mimetype: mediaMimeType
            };
          } else if (mtype === 'videoMessage') {
            msgContent = {
              video: mediaBuffer,
              caption: message.quoted.message.videoMessage.caption || '',
              mimetype: mediaMimeType,
              gifPlayback: message.quoted.message.videoMessage.gifPlayback || false
            };
          } else if (mtype === 'audioMessage') {
            msgContent = {
              audio: mediaBuffer,
              mimetype: mediaMimeType,
              ptt: message.quoted.message.audioMessage.ptt || false
            };
          } else if (mtype === 'documentMessage') {
            msgContent = {
              document: mediaBuffer,
              mimetype: mediaMimeType,
              fileName: message.quoted.message.document.fileName || 'file',
              caption: message.quoted.message.document.caption || ''
            };
          }
        } else {
          // For Text Messages, use the original quoted content structure
          // We copy the text message part specifically
          if (message.quoted.message.conversation) {
             msgContent = { conversation: message.quoted.message.conversation };
          } else if (message.quoted.message.extendedTextMessage) {
             msgContent = { extendedTextMessage: message.quoted.message.extendedTextMessage };
          } else {
             // Fallback for other types
             msgContent = message.quoted.message;
          }
        }

        // Generate and Send
        const forwardData = generateWAMessageFromContent(jid, msgContent, {
            userJid: client.user.id
        });

        await client.relayMessage(jid, forwardData.message, {
            messageId: forwardData.key.id
        });

        successCount++;

        // Progress update
        if ((index + 1) % 5 === 0 && uniqueJids.length > 5) {
          await reply(`📤 Sent to ${index + 1}/${uniqueJids.length} Channels...`);
        }
        
        // Delay
        if (index < uniqueJids.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1500));
        }
        
      } catch (error) {
        console.error(`Channel Forward error to ${jid}:`, error.message);
        failedJids.push({
          jid: jid.replace('@newsletter', ''),
          error: error.message.substring(0, 40)
        });
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }

    // Final Report
    let report = `✅ *Channel Forward Complete*\n\n` +
                 `📤 Success: ${successCount}/${uniqueJids.length}\n` +
                 `📦 Type: ${isMedia ? mtype.replace('Message', '').toUpperCase() : 'TEXT'}\n`;
    
    if (failedJids.length > 0) {
      report += `\n❌ Failed (${failedJids.length}):\n`;
      failedJids.slice(0, 5).forEach(f => {
        report += `• ${f.jid}: ${f.error}\n`;
      });
    }

    await reply(report);

  } catch (error) {
    console.error("Channel Forward Error:", error);
    await reply(`💢 Error: ${error.message.substring(0, 100)}`);
  }
});
