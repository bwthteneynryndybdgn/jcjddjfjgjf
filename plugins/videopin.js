// Kamran Tech
import { cmd } from "../command.js";
import { fileURLToPath } from 'url';
import Jimp from 'jimp';

const __filename = fileURLToPath(import.meta.url);

cmd({
  pattern: "fullpp1",
  alias: ["setpp1", "setdp1", "pp1", "setppbot1"],
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

    // Process image to make it square (Full DP fix)
    const jimpImg = await Jimp.read(buffer);
    const width = jimpImg.getWidth();
    const height = jimpImg.getHeight();
    const maxDim = Math.max(width, height);

    // Create a new square image with a black/white background and paste the original image in the center
    const squareImg = new Jimp(maxDim, maxDim, 0x000000FF); // Black background (0x000000FF)
    const x = Math.floor((maxDim - width) / 2);
    const y = Math.floor((maxDim - height) / 2);
    
    squareImg.composite(jimpImg, x, y);
    const processedBuffer = await squareImg.getBufferAsync(Jimp.MIME_JPEG);

    const botJid = client.decodeJid ? client.decodeJid(client.user.id) : client.user.id;

    // Update profile picture with the square buffer
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
