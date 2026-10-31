// KAMRAN MD - Fixed Universal Channel Forwarder

import { fileURLToPath } from 'url';
import { generateWAMessageFromContent, downloadMediaMessage } from '@whiskeysockets/baileys';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);

cmd({
  pattern: "cforward",
  alias: ["cfwd", "chanfwd"],
  desc: "Forward Text, Photo, Video, Audio to WhatsApp Channels (Fixed)",
  category: "owner",
  filename: __filename
}, async (client, message, match, { isCreator, reply, from }) => {
  try {
    // Owner check
    if (!isCreator) return await reply("*📛 Owner Only Command*");
    
    // Quoted message check
    if (!message.quoted) return await reply("*🍁 Please reply to a message to forward*");

    // Safe access to quoted message content
    const quotedMsg = message.quoted.message;
    if (!quotedMsg) return await reply("❌ Could not access quoted message content.");

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
    
    await reply(`🔄 Preparing content for ${uniqueJids.length} Channels...`);

    let successCount = 0;
    const failedJids = [];

    // Detect Message Type Safely
    const msgKeys = Object.keys(quotedMsg);
    if (msgKeys.length === 0) return await reply("❌ Empty message content.");
    
    const mtype = msgKeys[0]; // e.g., imageMessage, videoMessage, conversation
    const isMedia = ['imageMessage', 'videoMessage', 'audioMessage', 'documentMessage'].includes(mtype);
    
    let mediaBuffer = null;
    let mediaMimeType = '';
    let caption = '';

    // If it's media, download it first
    if (isMedia) {
      try {
        // Show downloading status only once
        if (uniqueJids.length > 0) await reply("📥 Downloading media...");
        
        mediaBuffer = await downloadMediaMessage(
          message.quoted,
          'buffer',
          {},
          { logger: console, reuploadRequest: client.updateMediaMessage }
        );
        
        // Extract details based on type
        const msgData = quotedMsg[mtype];
        
        if (mtype === 'imageMessage') {
            mediaMimeType = 'image/jpeg';
            caption = msgData.caption || '';
        } else if (mtype === 'videoMessage') {
            mediaMimeType = 'video/mp4';
            caption = msgData.caption || '';
        } else if (mtype === 'audioMessage') {
            mediaMimeType = 'audio/mpeg'; // Default, might vary
        } else if (mtype === 'documentMessage') {
            mediaMimeType = msgData.mimetype || 'application/octet-stream';
            caption = msgData.caption || '';
        }
        
      } catch (err) {
        console.error("Download Error:", err);
        return await reply("❌ Failed to download media. File might be too large or expired.");
      }
    }

    // Forward loop
    for (const [index, jid] of uniqueJids.entries()) {
      try {
        let msgContent = {};

        if (isMedia && mediaBuffer) {
          // Construct Media Message manually
          if (mtype === 'imageMessage') {
            msgContent = {
              image: mediaBuffer,
              caption: caption,
              mimetype: mediaMimeType
            };
          } else if (mtype === 'videoMessage') {
            msgContent = {
              video: mediaBuffer,
              caption: caption,
              mimetype: mediaMimeType,
              gifPlayback: quotedMsg[mtype].gifPlayback || false
            };
          } else if (mtype === 'audioMessage') {
            msgContent = {
              audio: mediaBuffer,
              mimetype: mediaMimeType,
              ptt: quotedMsg[mtype].ptt || false
            };
          } else if (mtype === 'documentMessage') {
            msgContent = {
              document: mediaBuffer,
              mimetype: mediaMimeType,
              fileName: quotedMsg[mtype].fileName || 'file',
              caption: caption
            };
          }
        } else {
          // For Text Messages
          if (mtype === 'conversation') {
             msgContent = { conversation: quotedMsg.conversation };
          } else if (mtype === 'extendedTextMessage') {
             msgContent = { extendedTextMessage: quotedMsg.extendedTextMessage };
          } else {
             // Fallback: Try sending the whole object if it's not standard text/media
             msgContent = quotedMsg;
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
        
        // Delay to prevent ban
        if (index < uniqueJids.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1500));
        }
        
      } catch (error) {
        console.error(`Channel Forward error to ${jid}:`, error.message);
        failedJids.push({
          jid: jid.replace('@newsletter', ''),
          error: error.message.substring(0, 40)
        });
        // Longer delay on error
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
