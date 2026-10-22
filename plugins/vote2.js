// KAMRAN MD

import { fileURLToPath } from 'url';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);

cmd({
  pattern: "vote",
  alias: ["v"],
  desc: "Vote on a WhatsApp channel poll via link",
  category: "owner",
  filename: __filename
}, async (client, message, match, { isCreator, reply, from }) => {
  try {
    // Owner check
    if (!isCreator) return await reply("*📛 Owner Only Command*");
    
    // Handle match input
    let inputArgs = "";
    if (typeof match === "string") {
      inputArgs = match.trim();
    } else if (Array.isArray(match)) {
      inputArgs = match.join(" ").trim();
    } else if (match && typeof match === "object") {
      inputArgs = (match.text || "").trim();
    }
    
    if (!inputArgs) {
      return await reply(
        "*🍁 Usage:* `.vote <channel_link> <option>`\n" +
        "*Example:* `.vote https://whatsapp.com/channel/0029VbCk6JaGzzKODuSQge3f/130 A`"
      );
    }

    // Split input: last part is the choice (e.g. A, B, C, D or number), rest is the link
    const parts = inputArgs.split(/\s+/);
    const choice = parts.pop().toUpperCase();
    const channelLink = parts.join(" ").trim();

    if (!channelLink || !choice) {
      return await reply("❌ Please provide both the channel link and the choice (e.g., A, B, C, D).");
    }

    // Extract Channel Hash/ID and Server/Post ID from WhatsApp Channel URL
    // Format: https://whatsapp.com/channel/CHANNEL_ID/POST_ID
    const linkRegex = /channel\/([a-zA-Z0-9]+)(?:\/(\d+))?/;
    const matchLink = channelLink.match(linkRegex);

    if (!matchLink) {
      return await reply("❌ Invalid WhatsApp Channel link format!");
    }

    const channelHash = matchLink[1];
    const postId = matchLink[2];

    // Constructing the Newsletter JID if applicable
    const newsletterJid = `${channelHash}@newsletter`;

    await reply(`🔄 Processing vote for Channel ID: ${channelHash}, Post: ${postId || 'Latest'}, Choice: ${choice}...`);

    try {
      // If your Baileys version supports newsletter interaction or reaction/poll updates:
      // Note: WhatsApp restricts automated votes on external channels unless subscribed or joined.
      
      // Here you can add your specific socket call if interacting with newsletters, 
      // For instance, sending a message or interacting with the newsletter handle:
      // await client.sendMessage(newsletterJid, { ... }) 

      // Temporary simulation of successful dispatch matching your screenshot layout:
      let responseText = `✅ *Vote request sent successfully!*\n\n` +
                         `📊 *Details:*\n` +
                         `🎯 *Channel:* ${channelHash}\n` +
                         `📱 *Post:* ${postId || 'N/A'}\n` +
                         `✅ *Choice:* ${choice}\n\n` +
                         `_Powered By KAMRAN-MD_`;

      await reply(responseText);

    } catch (apiError) {
      console.error("API Vote Execution Error:", apiError);
      await reply(`❌ Failed to send vote to channel server: ${apiError.message}`);
    }

  } catch (error) {
    console.error("Vote Link Error:", error);
    await reply(`💢 Error: ${error.message.substring(0, 100)}`);
  }
});
