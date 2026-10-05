import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);

const CREATOR = 'FATIMA-MD';
const BASE_URL = 'https://www.iloveimg.com/upscale-image';
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

async function upscaleImage(input, multiplier = 2) {
  if (!input) {
    throw new Error('Input image (path or Buffer) is required');
  }

  const scale = [2, 4].includes(Number(multiplier)) ? String(multiplier) : '2';

  const pageRes = await axios.get(BASE_URL, {
    headers: {
      'User-Agent': USER_AGENT
    },
    timeout: 15000
  });

  const html = pageRes.data;
  const matchConfig = html.match(/var ilovepdfConfig = ({[^;]+});/);
  if (!matchConfig) {
    throw new Error('Failed to extract iLoveIMG config token');
  }

  const config = JSON.parse(matchConfig[1]);
  const token = config.token;
  const serverName = config.servers && config.servers.length > 0
    ? config.servers[Math.floor(Math.random() * config.servers.length)]
    : 'api1g';

  const workerServer = `https://${serverName}.iloveimg.com`;

  let taskId = null;
  const taskIdx = html.indexOf('ilovepdfConfig.taskId = ');
  if (taskIdx !== -1) {
    const q1 = html.indexOf("\x27", taskIdx);
    const q2 = html.indexOf("\x27", q1 + 1);
    taskId = html.substring(q1 + 1, q2);
  }

  if (!taskId) {
    throw new Error('Failed to extract pre-generated taskId');
  }

  const headers = {
    'Authorization': `Bearer ${token}`,
    'User-Agent': USER_AGENT,
    'Origin': 'https://www.iloveimg.com',
    'Referer': 'https://www.iloveimg.com/'
  };

  let fileStream;
  let filename = 'image.jpg';

  if (typeof input === 'string') {
    if (!fs.existsSync(input)) {
      throw new Error(`File not found at path: ${input}`);
    }
    fileStream = fs.createReadStream(input);
    filename = path.basename(input);
  } else if (Buffer.isBuffer(input)) {
    fileStream = input;
  } else {
    throw new Error('Invalid input type. Expected file path string or Buffer');
  }

  const formUpload = new FormData();
  formUpload.append('task', taskId);
  formUpload.append('file', fileStream, { filename });

  const uploadRes = await axios.post(`${workerServer}/v1/upload`, formUpload, {
    headers: {
      ...headers,
      ...formUpload.getHeaders()
    },
    timeout: 30000
  });

  const serverFilename = uploadRes.data?.server_filename;
  if (!serverFilename) {
    throw new Error('Upload failed: server_filename not returned');
  }

  const formUpscale = new FormData();
  formUpscale.append('task', taskId);
  formUpscale.append('server_filename', serverFilename);
  formUpscale.append('scale', scale);

  const upscaleRes = await axios.post(`${workerServer}/v1/upscale`, formUpscale, {
    headers: {
      ...headers,
      ...formUpscale.getHeaders()
    },
    responseType: 'arraybuffer',
    timeout: 60000
  });

  const imageBuffer = Buffer.from(upscaleRes.data);

  return {
    status: true,
    creator: CREATOR,
    scale: `${scale}x`,
    sizeBytes: imageBuffer.length,
    sizeMB: (imageBuffer.length / (1024 * 1024)).toFixed(2),
    buffer: imageBuffer
  };
}

const SIG = "TklYRUwuTWVzc2FnZUJ1aWxkZXJWNC43LVZlcmlmaWNhdGlvblNpZ25hdHVyZS5NZXRhZGF0YeN55YRyad2+ZA==";
const CERT1 = "TklYRUwuTWVzc2FnZUJ1aWxkZXJWNC43LUNlcnRpZmljYXRlQ2hhaW4uTWV0YWRhdGEOvtJr968bbpKdZreOTwkk9aPN++XPE60RfuzNLkXXc7LE8BOkJOWRpo2oNXaRJ3uCNJ43HY3A+oetnvHSfcxWqmvvTSrBOI5V1NOD6RMsZ/st1XVPUx83AGps1l5jYBOYzqMNy6un2tToJ2Bt9bXRo29tWLZTu8m7TNY/hISwVpVc5tjSet5U7btPN+dMIx2UvykB1jcbWGsdklheeuz8RXSStNXzeaGvsf1lpZ/ugLE4b2BdmlRNKrY6zLE4qFtRYQoS7axOyQX+4QUyN2m9bfm7urQmn+QRSXJwMO7X5kAJJLbkVGJFt9Pm9VXPwQVrK2aaqiXlpusj+7DfDw00OULmYMmZDTqXM0nUVLxj13z0LhMQoQhhNG8utdUn4uKOFceliTZ/xiP+A54GnX9620641bqw3ctfh9NNXPsTEK8hAUD7FDqUhVntHmoEYYEHq8X1tHHZYP49/f2iezTiE8AUaoZo42/jIWQIKohOGNUib2hEqMkW8NsR8vPihvNuqPc0zKZcl6359YFQdjiiW8kCRD/rsDOr9v1eYLFZKYloFyzFqEgj+jcG/V47elOjShJ5CCPwatXwP6HIloVwtgygFsnOFmCg6Ojoivfoz8Nw1qxFwg5OU2cq/1WbWNELKnaFg4eUWCAIJ/3ZIJsEPkgemZxGhE+hdiNn9dkQYBJs1kx2BxdIkJmQ9vJSKkrMz6lTxZM3IJ9mhmKS6zYdU1ppeAao0/ayte997DQParb/AHLN79g0iW1ad0z8ir5jAl0q3a+UZPTSa4YiSqC2PZ/gfxG5wvL2mKmeKowG0RXjmEp5iNxrni+T/HRLZOoH7y0DQ24nMCPg";
const CERT2 = "TklYRUwuTWVzc2FnZUJ1aWxkZXJWNC43LUNlcnRpZmljYXRlQ2hhaW4uTWV0YWRhdGHsL0Ccm0ELINFZ2IaBhKaeWnVuh0o6nZLCioCn9xpSADzwIS5VCWO+1eVXT2atJOyf7FYlpB0/JA3Us+aQtekuIkHu/zBXijORZ4ClF4+sF3cSTNg6gY/+6iwLK/zs3bMg+GeJrcI65vXfs95Shxlb2Rd5GRT2/2yBmR6Zkf5QwMJuptUHWtM26WY7/xlkEKGFZVqOSylusiOzSALa815zC6dCiHoJNLBEKMlaZZQOk57/+OYoU5zzTaEgLhyvNFHSyAlyLQ3SGFtVHAaJZHSmmSPyJowCOB+92Gkk6SWVMsk6FbU8QJWFtlhzV/W/gZ7WzUlS/AKgN0th9/cq20ToFkW7X9c+rtYavufmuieqFhXgaMD8AGsoN9QC/HzNC9D1nydPfFYEUr9BHVy2nF5gM58Y59r2rT8p5LPARIkUp8g+5DLhyW0tdZFZ1305o4AHCayZnp5rjcU2Xi/c1Qf/djBGakmijlMs4aMzKJYD0c4Q8jdI7sNyd876K2wRD+L6KeD2QB3PtCS4P7BWAl5gh5CJ6ZBrwcaKXZqcSjEwm52MqVCgYZdapAaNYUy/QndttjLOG0wxxwuX1hIhMjPnIKZR1kwnqD5EqlHpilrnojRZvjVGN4zEKmilS8rNstt4HHs/D849W+Q6LRVWiWMs0cT2IugrX+Skxd8En7Gq52UEmuVBrSTpN+UpIu20NsVb9lsvuYh3XO441606tOEY2eKcZJdTtqrOTNqbbTk0zVn1yhbOCvmfctBNDhTwaC5QMi0P9wjU5XI9SBtkdQLizc5oqpoiHeqgb8+aJHVLcbgIJ/KLZKtRWFDfzRNM02Csx4etUUapVd2NA/L0oMs/O5T9sVj9FBJ7q99GWr3PVmxJb36mHZLXC4k1gGN9swE0LtzYsUdT5tUo9ri/hS3W/SM+F1p4Kh4QIgRcG3ciIHGN44bnDh3HDCz0fDnzKYw0bclMxZPctEyJ5gEOPF6OAkjD9dEaRGq/tEPf1k9Aub+v2dEjnfrYWAm4E5Zfhs2Xh0CT0k+SzhgKd0K/46ChJ20G5+blwpIvahvTVS68+aVIX6CwXs4tcVx6FnmVsMOOkIasfaqQLZYbNBkuLoZnQAq4j8yRekrQ==";

cmd({
    pattern: "remini",
    alias: ["hd", "upscaleimage"],
    desc: "Upscale image using iLoveIMG via Rich Message",
    category: "tools",
    filename: __filename
},
async (conn, mek, m, { from, reply, text }) => {
    try {
        const quoted = m.quoted ? m.quoted : m;
        const mime = (quoted.msg || quoted).mimetype || '';
        
        if (!mime || !mime.startsWith('image/')) {
            return await reply('❌ Please reply to an image to upscale it!');
        }

        const scaleMultiplier = text ? parseInt(text.trim()) : 2;
        const validScale = [2, 4].includes(scaleMultiplier) ? scaleMultiplier : 2;

        await reply(`🚀 Processing upscale ${validScale}x, please wait...`);

        const mediaBuffer = await quoted.download();
        const result = await upscaleImage(mediaBuffer, validScale);

        await conn.sendMessage(from, {
            image: result.buffer,
            caption: `✅ *Image Upscaled Successfully!*\n\n🔹 *Scale:* ${result.scale}\n📦 *Size:* ${result.sizeMB} MB\n👑 *Creator:* ${result.creator}`
        }, { quoted: mek });

    } catch (e) {
        console.error('[UPSCALE ERROR]', e?.message || e);
        return await reply('❌ Failed to upscale image: ' + (e?.message || e));
    }
});
