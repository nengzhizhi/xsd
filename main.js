'use strict';

const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const cv = require('opencv');
const GifRecorder = require('./lib/GifRecorder.js');

let mainWindow;
const ipcMain = electron.ipcMain;

var recorder = new GifRecorder();

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
  mainWindow = new BrowserWindow({
    fullscreen: true,
    titleBarStyle: '星视度',
    autoHideMenuBar: true
  });

  mainWindow.loadURL('file://' + __dirname + '/index.html');
  mainWindow.webContents.openDevTools();
  mainWindow.on('closed', function () {
    mainWindow = null;
  })
  mainWindow.webContents.on('did-finish-load', function(){
    var camera = new cv.VideoCapture(0);
    setInterval(function () {
      camera.read(function (err, image) {
        if (err)
          throw err;

        var image = dermabrasion(cropImage(image));

        if (!!mainWindow) {
          mainWindow.webContents.send('opencv image', {
            image: image.toBuffer().toString('base64')
          });          
        }

        if (!!recorder && recorder.writeFrame(image.toBuffer()) < 0 ) {
          recorder.stopRecord('xxx.gif', function (gifUrl) {
            //console.log(gifUrl);
            mainWindow.webContents.send('image recorded', {
              image: image.toBuffer().toString('base64')
            })
          })
        }
      })
    }, 20);
  })

  ipcMain.on('start record', function (event, args) {
    recorder.startRecord('./tmp/');
  })
}


app.on('ready', createWindow);
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }    
})