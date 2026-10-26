// Kamran Tech
import { cmd } from "../command.js";
import { fileURLToPath } from 'url';
import { Jimp } from 'jimp';

const __filename = fileURLToPath(import.meta.url);

cmd({
  pattern: "fullpp",
  alias: ["setpp", "setdp", "pp", "setppbot", "fullpp1"],
  react: "🖼️",
  desc: "Owner Only - Set bot's full profile picture with blur background",
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

    const image = await Jimp.read(buffer);
    const width = image.bitmap.width;
    const height = image.bitmap.height;
    const maxDim = Math.max(width, height);

    // Create background by cloning, resizing to cover, and blurring
    const bgImage = image.clone();
    bgImage.cover({ w: maxDim, h: maxDim });
    bgImage.blur(20); // Background ko blur kar diya taaki black na aaye

    // Paste original image in the center
    const x = Math.floor((maxDim - width) / 2);
    const y = Math.floor((maxDim - height) / 2);
    bgImage.composite(image, x, y);

    const processedBuffer = await bgImage.getBuffer("image/jpeg");

    const botJid = client.decodeJid ? client.decodeJid(client.user.id) : client.user.id;

    await client.updateProfilePicture(botJid, processedBuffer);
    
    await client.sendMessage(from, {
      text: "*✅ Bot's full profile picture updated successfully with blur background!*"
    }, { quoted: message });

  } catch (error) {
    console.error("fullpp Error:", error);
    await client.sendMessage(from, {
      text: "❌ Error updating profile picture:\n" + error.message
    }, { quoted: message });
  }
});
