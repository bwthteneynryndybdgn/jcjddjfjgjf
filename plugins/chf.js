// KAMRAN MD - Final Fixed Channel Forwarder

import { fileURLToPath } from 'url';
import { generateWAMessageFromContent, downloadMediaMessage } from '@whiskeysockets/baileys';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);

cmd({
  pattern: "cforward",
  alias: ["cfwd", "chanfwd"],
  desc: "Forward any message to WhatsApp Channels",
  category: "owner",
  filename: __filename
}, async (client, message, match, { isCreator, reply, from }) => {
  try {
    // 1. Owner Check
    if (!isCreator) return await reply("*📛 Owner Only Command*");
    
    // 2. Quoted Message Check (Safe Way)
    // Hum directly message.quoted ko check karenge, kyunki baaz dafa .message undefined hota hai agar quoted object hi na ho
    if (!message.quoted || !message.quoted.message) {
        return await reply("*🍁 Please reply to a valid message (Text/Photo/Video/Audio)*");
    }

    const qmsg = message.quoted;
    const qcontent = qmsg.message;

    // 3. Handle JID Input
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
        "*Note:* Reply to the message you want to forward."
      );
    }

    // 4. Process JIDs (Filter for Channels only)
    const rawJids = jidInput.split(',').map(jid => jid.trim()).filter(jid => jid);
    
    const validJids = rawJids
      .map(jid => {
        // Agar @newsletter already hai
        if (jid.endsWith('@newsletter')) {
          return jid; 
        }
        // Agar sirf numbers hain, to @newsletter laga do
        else if (/^\d+$/.test(jid)) {
          return `${jid}@newsletter`;
        }
        // Baaki sab ignore (groups/personal chats)
        return null;
      })
      .filter(jid => jid !== null)
      .slice(0, 50); // Max 50 channels

    if (validJids.length === 0) {
      return await reply("❌ No valid Channel IDs found. Use format: ID@newsletter or just ID.");
    }

    const uniqueJids = [...new Set(validJids)];
    
    // 5. Detect Message Type & Prepare Content
    const mtype = Object.keys(qcontent)[0];
    const isMedia = ['imageMessage', 'videoMessage', 'audioMessage', 'documentMessage'].includes(mtype);
    
    await reply(`🔄 Processing ${isMedia ? 'Media' : 'Text'} for ${uniqueJids.length} Channels...`);

    let mediaBuffer = null;
    let msgPayload = {};

    if (isMedia) {
        try {
            // Download Media
            mediaBuffer = await downloadMediaMessage(
                qmsg,
                'buffer',
                {},
                { logger: console, reuploadRequest: client.updateMediaMessage }
            );

            const mediaData = qcontent[mtype];

            if (mtype === 'imageMessage') {
                msgPayload = {
                    image: mediaBuffer,
                    caption: mediaData.caption || '',
                    mimetype: mediaData.mimetype || 'image/jpeg'
                };
            } else if (mtype === 'videoMessage') {
                msgPayload = {
                    video: mediaBuffer,
                    caption: mediaData.caption || '',
                    mimetype: mediaData.mimetype || 'video/mp4',
                    gifPlayback: mediaData.gifPlayback || false
                };
            } else if (mtype === 'audioMessage') {
                msgPayload = {
                    audio: mediaBuffer,
                    mimetype: mediaData.mimetype || 'audio/mpeg',
                    ptt: mediaData.ptt || false
                };
            } else if (mtype === 'documentMessage') {
                msgPayload = {
                    document: mediaBuffer,
                    mimetype: mediaData.mimetype || 'application/octet-stream',
                    fileName: mediaData.fileName || 'file',
                    caption: mediaData.caption || ''
                };
            }
        } catch (err) {
            console.error("Media Download Error:", err);
            return await reply("❌ Failed to download media. It might be too large or expired.");
        }
    } else {
        // Handle Text Messages
        if (mtype === 'conversation') {
            msgPayload = { conversation: qcontent.conversation };
        } else if (mtype === 'extendedTextMessage') {
            msgPayload = { extendedTextMessage: qcontent.extendedTextMessage };
        } else {
            // Fallback for other types (stickers, contacts etc if needed later)
            msgPayload = qcontent;
        }
    }

    // 6. Forward Loop
    let successCount = 0;
    const failedJids = [];

    for (const [index, jid] of uniqueJids.entries()) {
      try {
        // Generate Message
        const forwardData = generateWAMessageFromContent(jid, msgPayload, {
            userJid: client.user.id
        });

        // Send via Relay
        await client.relayMessage(jid, forwardData.message, {
            messageId: forwardData.key.id
        });

        successCount++;

        // Progress Update
        if ((index + 1) % 5 === 0 && uniqueJids.length > 5) {
          await reply(`📤 Sent to ${index + 1}/${uniqueJids.length} Channels...`);
        }
        
        // Delay
        if (index < uniqueJids.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1500));
        }
        
      } catch (error) {
        console.error(`Forward error to ${jid}:`, error.message);
        failedJids.push(jid.replace('@newsletter', ''));
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }

    // 7. Final Report
    let report = `✅ *Channel Forward Complete*\n\n` +
                 `📤 Success: ${successCount}/${uniqueJids.length}\n` +
                 `📦 Type: ${mtype.replace('Message', '').toUpperCase()}\n`;
    
    if (failedJids.length > 0) {
      report += `\n❌ Failed (${failedJids.length}): ${failedJids.slice(0,3).join(', ')}...`;
    }

    await reply(report);

  } catch (error) {
    console.error("Global Error:", error);
    await reply(`💢 Error: ${error.message}`);
  }
});
