var pngFileStream = require('png-file-stream');
var GifEncoder = require('gifencoder');

var encoder = new GIFEncoder(480, 480);

pngFileStream('../test/images/frame?.png')
  .pipe(encoder.createWriteStream({ repeat: -1, delay: 500, quality: 10 }))
  .pipe(fs.createWriteStream('myanimated.gif'));
