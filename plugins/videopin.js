// Kamran Tech
import { cmd } from "../command.js";
import { fileURLToPath } from 'url';
import { Jimp } from 'jimp';

const __filename = fileURLToPath(import.meta.url);

cmd({
  pattern: "fullpp2",
  alias: ["setpp", "setdp", "pp1", "setppbot", "fullpp1"],
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

    // Download original image buffer
    const buffer = await match.quoted.download();

    // Process image to make it square using Jimp v1+ syntax
    const image = await Jimp.read(buffer);
    const width = image.bitmap.width;
    const height = image.bitmap.height;
    const maxDim = Math.max(width, height);

    // Create a new square background image and composite original image in center
    const squareImg = new Jimp({ width: maxDim, height: maxDim, color: 0x000000FF });
    
    const x = Math.floor((maxDim - width) / 2);
    const y = Math.floor((maxDim - height) / 2);
    
    squareImg.composite(image, x, y);
    const processedBuffer = await squareImg.getBuffer("image/jpeg");

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
