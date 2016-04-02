var GIFEncoder = require('gifencoder');
var PNGFileStream = require('png-file-stream');
var cv = require('opencv');
var fs = require('fs');

var encoder;
var savePath;
var frameSequence = 0;

process.on('message', function (message) {
  if (message.command == 'start record') {
    savePath = message.data.savePath;
    encoder = new GIFEncoder(480, 480);

    // fs.rmdirSync(savePath);
    // fs.mkdirSync(savePath);

  } else if (message.command == 'write frame') {
    frameSequence ++;

    cv.readImage(new Buffer(message.data.frame), function (err, mat) {
      mat.save(savePath + 'frame-' + frameSequence.toString() + '.png');
    })
  } else if (message.command == 'stop record') {
    PNGFileStream(savePath + 'frame-?.png')
      .pipe(encoder.createWriteStream({
					repeat: 0,
					delay: 100,
					quality: 10
			}))
      .pipe(fs.createWriteStream(savePath + message.data.GifFileName));

    process.send({
      command: 'record stopped'
    })
  }
})
