const parseString = require('xml2js').parseString;
const fs = require('fs'), Canvas = require('canvas');

function redactImage(image, result, wordsToHide) {
    const xml = result.hocr;
    let ocrWords = [];
    let wordDict = {}
    parseString(xml, function (err, result) {
        result.div.div.forEach(groups => {
            groups.p.forEach(para => {
                para.span.forEach(line => {
                    line.span.forEach(words => {
                        console.log(words);
                        ocrWords.push(words);
                    })
                });
            });
        });
        // if we find word "tree" in "ocrWords", then store coordinates in dictionary "wordDict".
        ocrWords.forEach((word, index) => {
            let node = word.strong[0].em[0];
            let nodeMeta = word.$;
            if (node) {
                node = node.toLowerCase();
                let coordinates = nodeMeta.title;
                coordinates = coordinates.split(';').join('').split(" ");
                word = {}
                word["text"] = node
                word["left"] = coordinates[1]
                word["top"] = coordinates[2]
                word["right"] = coordinates[3]
                word["bottom"] = coordinates[4]
                wordDict[index] = word
            }
        });
        var img = new Canvas.Image; // Create a new Image
        img.src = image;

        // Initialiaze a new Canvas with the same dimensions
        // as the image, and get a 2D drawing context for it.
        var canvas = new Canvas.Canvas(img.width, img.height);
        var ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, img.width, img.height);
        Object.keys(wordDict).forEach(index => {
            const word = wordDict[index];
            if (word && word.text && wordsToHide.includes(word.text)) {
                let x = wordDict[index].left, 
                y = wordDict[index].top,
                width = wordDict[index].right - wordDict[index].left,
                height = wordDict[index].bottom - wordDict[index].top;
                ctx.fillRect(x, y, width, height);        
            }
        })
        const out = fs.createWriteStream(__dirname + '/test.png')
        const stream = canvas.createPNGStream()
        stream.pipe(out)
        out.on('finish', () =>  console.log('The PNG file was created.'))
    });
}
module.exports = redactImage

// # create and print ImageMagick command to:
// #   1) replace all instances of word "tree" with black box
// #   2) put phrase "{REDACTED}" inside the box.
// cmd = ["convert 001da.tif -fill black -pointsize 12 -stroke red"]
// for word in wordDict:
//   word = wordDict[word]
//   average = int(word["top"]) + int(word["bottom"])
//   average = average/2
//   cmd_part = '''-draw "rectangle %s,%s %s,%s" -draw "text %s,%s ' {REDACTED} '"''' %(word["left"], word["top"], word["right"], word["bottom"], word["left"], average)
//   cmd.append(cmd_part)
// cmd.append("001da.png")
// cmd = " ".join(cmd)
// print cmd