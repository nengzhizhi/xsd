var pngFileStream = require('png-file-stream');
var GIFEncoder = require('gifencoder');
var cv = require('opencv');
var fs = require('fs');

var frameSequence;

process.on('message', function (message) {
	if (message.command == 'start record') {
		encoder = new GIFEncoder(480, 480);
		frameSequence = 0;

		setTimeout(function () {
			process.send({ 
				command: 'stop record'
			});

			pngFileStream('./images/frame-?.png')
				.pipe(encoder.createWriteStream({
					repeat: 0,
					delay: 100,
					quality: 10 
				}))
				.pipe(fs.createWriteStream('./images/myanimated.gif'));
		}, 5000);

	} else if (message.command == 'frame') {
		if (!!message.data.frame) {
			cv.readImage(new Buffer(message.data.frame), function (err, mat) {
				frameSequence ++;
				mat.save('./images/frame-' + frameSequence.toString() + '.png');
			})
		}
	}
})