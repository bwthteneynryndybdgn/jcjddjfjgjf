// KAMRAN MD - Channel Forwarder

import { fileURLToPath } from 'url';
import { generateWAMessageFromContent } from '@whiskeysockets/baileys';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);

cmd({
  pattern: "cforward", // Command name change kiya hai taaki alag se use kar sakein
  alias: ["cfwd", "chanfwd"],
  desc: "Forward messages to WhatsApp Channels using native method",
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
        "*Note:* Sirf Channel IDs dalein (without @newsletter).\n" +
        "*Example:* `.cforward 120363xxx...@newsletter`\n" +
        "*Example (IDs only):* `.cforward 120363xxx...,987654xxx...`\n" +
        "Reply to a message first!"
      );
    }

    // Process JIDs - Specifically targeting Channels
    const rawJids = jidInput.split(',').map(jid => jid.trim()).filter(jid => jid);
    
    const validJids = rawJids
      .map(jid => {
        // Agar user ne poora JID daala hai (with @newsletter)
        if (jid.includes('@newsletter')) {
          const numbers = jid.match(/\d+/g);
          if (!numbers || numbers.length === 0) return null;
          return `${numbers.join('')}@newsletter`;
        } 
        // Agar sirf ID daali hai, to hum @newsletter append karenge
        else if (/^\d+$/.test(jid)) {
          return `${jid}@newsletter`;
        }
        // Agar g.us ya s.whatsapp.net aaya to usko ignore kar denge kyunki ye channel command hai
        return null;
      })
      .filter(jid => jid !== null)
      .slice(0, 50); // Max 50 channels at once

    if (validJids.length === 0) {
      return await reply("❌ No valid Channel JIDs found. Ensure IDs end with @newsletter or are numeric.");
    }

    // Remove duplicates
    const uniqueJids = [...new Set(validJids)];
    
    // Start processing
    await reply(`🔄 Forwarding to ${uniqueJids.length} Channels...`);

    let successCount = 0;
    const failedJids = [];

    // Get the quoted message content
    const quotedContent = message.msg?.contextInfo?.quotedMessage;
    
    if (!quotedContent) {
      return await reply("❌ Could not extract quoted message content");
    }

    // Create message structure for forwarding
    const messageContent = { ...quotedContent };

    // Forward to each channel
    for (const [index, jid] of uniqueJids.entries()) {
      try {
        // Generate WA Message
        const forwardData = generateWAMessageFromContent(
          jid,
          messageContent,
          { userJid: client.user.id }
        );

        // Send using relayMessage
        await client.relayMessage(jid, forwardData.message, {
          messageId: forwardData.key.id
        });

        successCount++;
        
        // Progress update every 5 chats
        if ((index + 1) % 5 === 0 && uniqueJids.length > 5) {
          await reply(`📤 Sent to ${index + 1}/${uniqueJids.length} Channels...`);
        }
        
        // Delay to avoid ban/rate limit
        if (index < uniqueJids.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1500)); // Thoda zyada delay channels ke liye safe hai
        }
        
      } catch (error) {
        console.error(`Channel Forward error to ${jid}:`, error.message);
        failedJids.push({
          jid: jid.replace('@newsletter', ''),
          error: error.message.substring(0, 40)
        });
        // Error hone par thoda rukna
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }

    // Final report
    let report = `✅ *Channel Forward Complete*\n\n` +
                 `📤 Success: ${successCount}/${uniqueJids.length}\n`;
    
    const contentType = Object.keys(quotedContent)[0] || 'unknown';
    report += `📦 Content Type: ${contentType.replace('Message', '')}\n`;
    report += `📢 Target: Channels Only\n`;
    
    if (failedJids.length > 0) {
      report += `\n❌ Failed (${failedJids.length}):\n`;
      failedJids.slice(0, 5).forEach(f => {
        report += `• ${f.jid}: ${f.error}\n`;
      });
      if (failedJids.length > 5) report += `... +${failedJids.length - 5} more`;
    }

    await reply(report);

  } catch (error) {
    console.error("Channel Forward Error:", error);
    await reply(`💢 Error: ${error.message.substring(0, 100)}`);
  }
});
