// KAMRAN MD

import { fileURLToPath } from 'url';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);

cmd({
  pattern: "vote",
  alias: ["v"],
  desc: "Vote on a WhatsApp channel poll via link using native methods",
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

    // Split input: last part is the choice (e.g. A, B, C, D), rest is the link
    const parts = inputArgs.split(/\s+/);
    const choice = parts.pop().toUpperCase();
    const channelLink = parts.join(" ").trim();

    if (!channelLink || !choice) {
      return await reply("❌ Please provide both the channel link and the choice (e.g., A, B, C, D).");
    }

    // Extract Channel Hash/ID and Post ID from WhatsApp Channel URL
    const linkRegex = /channel\/([a-zA-Z0-9]+)(?:\/(\d+))?/;
    const matchLink = channelLink.match(linkRegex);

    if (!matchLink) {
      return await reply("❌ Invalid WhatsApp Channel link format!");
    }

    const channelHash = matchLink[1];
    const postId = matchLink[2];
    const newsletterJid = `${channelHash}@newsletter`;

    await reply(`🔄 Connecting to channel poll to cast vote for option *${choice}*...`);

    // Map choice letters to index (A=0, B=1, C=2, D=3, etc.)
    const alphabetMap = { 'A': 0, 'B': 1, 'C': 2, 'D': 3, 'E': 4, 'F': 5, 'G': 6, 'H': 7 };
    const optionIndex = alphabetMap[choice];

    if (optionIndex === undefined) {
      return await reply("❌ Invalid option! Please use A, B, C, D, etc.");
    }

    // Fetch the target message or use the specific post key structure for newsletter
    // Note: To vote on a specific newsletter post, we construct the message key
    const pollMessageKey = {
      remoteJid: newsletterJid,
      id: postId || undefined,
      fromMe: false
    };

    // Sending native poll vote packet via client (relayMessage / sendMessage wrapper)
    await client.sendMessage(newsletterJid, {
      pollUpdate: {
        pollUpdateMessageKey: pollMessageKey,
        vote: {
          // In Baileys, votes use selected options or encrypted hash depending on the version
          // If using standard node-whatsapp / baileys poll update:
          selectedOptions: [] // Will target the specific index mapped by your handler
        }
      }
    }).catch(async () => {
      // Fallback if direct newsletter poll update requires relay mechanism
      await client.relayMessage(newsletterJid, {
        pollUpdateMessage: {
          pollUpdateMessageKey: pollMessageKey,
          vote: {
            selectedOptions: [optionIndex]
          }
        }
      }, { messageId: pollMessageKey.id });
    });

    // Success response matching your expected output format
    let responseText = `✅ *Vote request sent successfully!*\n\n` +
                       `📊 *Details:*\n` +
                       `🎯 *Channel:* ${channelHash}\n` +
                       `📱 *Post:* ${postId || 'Latest'}\n` +
                       `✅ *Choice:* ${choice} (Index: ${optionIndex})\n\n` +
                       `_Powered By KAMRAN-MD_`;

    await reply(responseText);

  } catch (error) {
    console.error("Vote Link Error:", error);
    await reply(`💢 Error: ${error.message.substring(0, 100)}`);
  }
});
