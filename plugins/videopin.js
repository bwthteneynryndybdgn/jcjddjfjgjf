/*const Jimp = require("jimp");
const fs = require("fs");

module.exports = { 
  name: "fullpp",
  description: "Set fullpp on your dp",
  category: "Owner",
  start:async(vorterx,m,{prefix,mime,quoted,text,toReact,pushName, command}) => {

    await toReact("✔️");
	  if (/image/.test(mime)) {
let media = await vorterx.downloadAndSaveMediaMessage(quoted)
            if (text.toLowerCase() === "original") {
                var { preview } = await generateProfilePicture(media)
                await vorterx.query({
                    tag: 'iq',
                    attrs: {
                        to: m.from,
                        type:'set',
                        xmlns: 'w:profile:picture'
                    },
                    content: [{
                        tag: 'picture',
                        attrs: { type: 'image' },
                        content: preview
                    }]
                })
                fs.unlinkSync(media)
            } else {
                await updateProfilePicture(m.from, user, media, m)
                .then( res => {
                    vorterx.sendMessage(m.from,{text:"*Profile picture has been updated successfully*"});
                    fs.unlinkSync(media)
                }).catch() => 

            }
        } else {
                    vorterx.sendMessage(m.from,{text:"Reply to an image only"}) 
        }
	},
}

async function generateProfilePicture(buffer) {
    const jimp = await Jimp.read(buffer)
    const min = jimp.getWidth()
    const max = jimp.getHeight()
    const cropped = jimp.crop(0, 0, min, max)
    return {
        img: await cropped.scaleToFit(720, 720).getBufferAsync(Jimp.MIME_JPEG),
        preview: await cropped.normalize().getBufferAsync(Jimp.MIME_JPEG)
    }
};
*/
