'use strict';

const electron = require('electron');
// Module to control application life.
const app = electron.app;
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow;
const cv = require('opencv');
const fs = require('fs');
const childProcess = require('child_process');

//------------------------------------------------------------------------
var isRecording = false;
var isSnapped = false;
var imageRecorder = childProcess.fork('./imageRecorder.js');
imageRecorder.on('message', function (message) {
  if (message.command == 'stop record') {
    isRecording = false;
  }
})

function startRecordImage(){
  if (!!isRecording)
    return;

  isRecording = true;
  isSnapped = false;
  imageRecorder.send({
    command: "start record"
  })
}
//------------------------------------------------------------------------

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

// function dermabrasion(image){
//   var result = image.copy();

//   result.bilateralFilter(10, 30, 50);
//   //result.addWeighted(image, -1, result, 1, 128);
//   result.gaussianBlur([3, 3]);
//   result.addWeighted(image, 0.5, result, 0.5);
//   return result;
// }


// function blendImage(image1, opacity1, image2, opacity2){
//   var result = image1.copy();

//   for (var i = 0; i < image1.height(); i++) {
//     for (var j = 0; j < image1.width(); j ++) {

//       i = i + j;

//       //var r = (image1.pixel(i, j)[0] * (100 - opacity1) + (image1.pixel(i, j)[0] + 2 * image2.pixel(i, j)[0] - 256) * opacity1) / 100;
//       // var g = (image1.pixel(i, j)[1] * (100 - opacity1) + (image1.pixel(i, j)[1] + 2 * image2.pixel(i, j)[1] - 256) * opacity1) / 100;
//       // var b = (image1.pixel(i, j)[2] * (100 - opacity1) + (image1.pixel(i, j)[2] + 2 * image2.pixel(i, j)[2] - 256) * opacity1) / 100;

//       //result.pixel(i, j, [r, g, b]);
//     }
//   }

//   return result;
// }

function dermabrasion(image){
  image.bilateralFilter(10, 30, 50);
  return image;
}

function cropImage(image){
  var x = (image.width() - image.height()) / 2;
  var y = 0;
  var width = image.height();
  var height = image.height();

  return image.copy().crop(x, y, width, height);
}

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    fullscreen: true,
    titleBarStyle: '星视度',
    autoHideMenuBar: true
  });

  //------------------------------------------------------------------------------
  var ipcMain = require('electron').ipcMain;
  var cameraInterval = null;
  //------------------------------------------------------------------------------

  ipcMain.on('record image', function(event, arg) {
    startRecordImage();
  });


  // and load the index.html of the app.
  mainWindow.loadURL('file://' + __dirname + '/index.html');

  // Open the DevTools.
  mainWindow.webContents.openDevTools();

  // Emitted when the window is closed.
  mainWindow.on('closed', function() {
    clearInterval(cameraInterval);
    mainWindow = null;
  });

  mainWindow.webContents.on('did-finish-load', function() {
    var camera = new cv.VideoCapture(0);
    cameraInterval = setInterval(function () {
      camera.read(function (err, image) {
        if (err) throw err;

        var dermabrasionImage = dermabrasion(cropImage(image));

        if (!!mainWindow) {
          mainWindow.webContents.send('opencv image', {
            image: dermabrasionImage.toBuffer().toString('base64')
          });
        }

        if (!!isRecording) {
          if (!isSnapped) {
            mainWindow.webContents.send('snapshot', {
              snapshot: dermabrasionImage.toBuffer().toString('base64'),
              sequence: 1
            });

            isSnapped = true;         
          }

          imageRecorder.send({
            command: 'frame',
            data: {
              frame: dermabrasionImage.toBuffer()
            }
          })
        }
      });
    }, 20);
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// app.on('activate', function () {
//   // On OS X it's common to re-create a window in the app when the
//   // dock icon is clicked and there are no other windows open.
//   if (mainWindow === null) {
//     createWindow();
//   }
// });
