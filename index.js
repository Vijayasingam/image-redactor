// https://github.com/naptha/tesseract.js
const tesseract = require('tesseract.js');
const path = require('path');
const redactImage = require('./redactor');

const image = path.join('images', 'example.png')
const worker = new tesseract.TesseractWorker();
const wordsToHide = ['same', 'english', 'support'];
worker.recognize(image).progress(progress => {
    console.log('progress', progress);
}).then(result => {
    console.log('result', Object.keys(result));
    console.log(result.text);
    worker.terminate();
    redactImage(image, result, wordsToHide);
});