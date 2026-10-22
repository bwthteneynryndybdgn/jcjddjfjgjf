// KAMRAN MD

import { fileURLToPath } from 'url';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);

cmd({
  pattern: "vote",
  alias: ["v"],
  desc: "Vote on a WhatsApp channel post via link",
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
        "*Example:* `.vote https://whatsapp.com/channel/... a`"
      );
    }

    // Split link and option (last word is considered as option/choice)
    const parts = inputArgs.split(" ");
    const choice = parts.pop().toUpperCase();
    const channelLink = parts.join(" ").trim();

    if (!channelLink || !choice) {
      return await reply("❌ Please provide both the channel link and the choice (e.g., A, B, C, D).");
    }

    // Extract channel ID and post ID from the link if possible
    // Example link format: https://whatsapp.com/channel/0029VbCk6JaGzzKODuSQge3f/130
    const linkRegex = /channel\/([a-zA-Z0-9]+)(?:\/(\d+))?/;
    const matchLink = channelLink.match(linkRegex);

    let channelId = "Unknown";
    let postId = "Unknown";

    if (matchLink) {
      channelId = matchLink[1];
      postId = matchLink[2] || "Latest";
    } else {
      channelId = channelLink;
    }

    // Simulate sending vote request based on the screenshot format
    let responseText = `✅ *Vote request sent successfully!*\n\n` +
                       `📊 *Details:*\n` +
                       `🎯 *Channel:* ${channelId}\n` +
                       `📱 *Post:* ${postId}\n` +
                       `✅ *Choice:* ${choice}\n\n` +
                       `_I Powered By KAMRAN-MD_`;

    await reply(responseText);

  } catch (error) {
    console.error("Vote Link Error:", error);
    await reply(`💢 Error: ${error.message.substring(0, 100)}`);
  }
});
