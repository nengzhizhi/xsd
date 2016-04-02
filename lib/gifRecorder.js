var childProcess = require('child_process');

function GifRecorder(){
  this.recording = false;
  this.worker = childProcess.fork('./lib/gifRecorderWorker.js');
}

GifRecorder.prototype.startRecord = function (savePath) {
  if (!!this.recording)
    return;

  if (!!this.worker) {
    this.worker.send({
      command: 'start record',
      data: {
        savePath: savePath
      }
    })
    this.recording = true;
    this.frameNumber = 50;
  }
}

GifRecorder.prototype.stopRecord = function (GifFileName, callback) {
  var self = this;
  if (!this.recording)
    return;

  this.worker.on('message', function (message) {
    if (message.command == 'record stopped') {
      callback(GifFileName);
    }
  })

  this.worker.send({
    command: 'stop record',
    data: {
      GifFileName: GifFileName
    }
  })
}

GifRecorder.prototype.writeFrame = function (frameData) {
  var self = this;

  if (!!this.recording && !!this.worker) {
    this.worker.send({
      command: 'write frame',
      data: {
        frame: frameData
      }
    })

    if (this.frameNumber-- < 0) {
      self.recording = false;
    }
  }

  return this.frameNumber;
}

module.exports = GifRecorder;
