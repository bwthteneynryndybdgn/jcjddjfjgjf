// AHMAD Tech
import { cmd } from "../command.js";
import { fileURLToPath } from 'url';
import Jimp from 'jimp';

const __filename = fileURLToPath(import.meta.url);

cmd({
  pattern: "fullpp",
  alias: ["setpp", "setdp", "pp", "setppbot"],
  react: "🖼️",
  desc: "Owner Only - Set full image as bot's profile picture",
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

    await client.sendMessage(from, {
      text: "*⏳ Processing full profile picture, please wait...*"
    }, { quoted: message });

    const buffer = await match.quoted.download();
    
    // Jimp Processing Pipeline (Square blurred bg + centered image)
    const image = await Jimp.read(buffer);
    const blurredBg = image.clone().cover(640, 640).blur(10);
    const centeredImage = image.clone().contain(640, 640);
    blurredBg.composite(centeredImage, 0, 0);
    const finalImage = await blurredBg.getBufferAsync(Jimp.MIME_JPEG);

    const botJid = client.decodeJid ? client.decodeJid(client.user.id) : client.user.id;

    await client.updateProfilePicture(botJid, finalImage);
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
