// Kamran Tech
import { cmd } from "../command.js";
import { fileURLToPath } from 'url';
import { Jimp } from 'jimp';

const __filename = fileURLToPath(import.meta.url);

cmd({
  pattern: "fullpp1",
  alias: ["setpp", "setdp", "pp", "setppbot", "fullpp2"],
  react: "🖼️",
  desc: "Owner Only - Set bot's full profile picture",
  category: "owner",
  filename: __filename
}, async (client, message, match, { from, isCreator }) => {
  try {
    if (!isCreator) {
      return await client.sendMessage(from, {
        text: "*📛 This is an owner command.*"
      }, { quoted: message });
    }

    if (!match.quoted) {
      return await client.sendMessage(from, {
        text: "*🍁 Please reply to an image with .fullpp*"
      }, { quoted: message });
    }

    const mtype = match.quoted.mtype;
    
    if (mtype !== "imageMessage") {
      return await client.sendMessage(from, {
        text: "❌ Only image messages are supported for profile picture"
      }, { quoted: message });
    }

    const buffer = await match.quoted.download();

    // Load image with Jimp
    const image = await Jimp.read(buffer);
    
    // WhatsApp profile pictures look best and don't get distorted when resized to 720x720 standard HD square
    image.cover({ w: 720, h: 720 });

    const processedBuffer = await image.getBuffer("image/jpeg");

    const botJid = client.decodeJid ? client.decodeJid(client.user.id) : client.user.id;

    // Update profile picture
    await client.updateProfilePicture(botJid, processedBuffer);
    
    await client.sendMessage(from, {
      text: "*✅ Bot's full profile picture updated successfully!*"
    }, { quoted: message });

  } catch (error) {
    console.error("fullpp Error:", error);
    await client.sendMessage(from, {
      text: "❌ Error updating profile picture:\n" + error.message
    }, { quoted: message });
  }
});
