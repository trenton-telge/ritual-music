'use strict'

import electron, {app, BrowserWindow, protocol} from 'electron'
import {createProtocol} from 'vue-cli-plugin-electron-builder/lib'
import installExtension, {VUEJS3_DEVTOOLS} from 'electron-devtools-installer'
import dataurl from "dataurl";
import fs, {realpathSync} from "fs";
import bufferToDataUrl from "buffer-to-data-url";
/*const Store = require('electron-store');
const store = new Store();*/
const Datastore = require('nedb-promises')
let datastore = Datastore.create({filename: './library.db', autoload: true});
/** https://www.npmjs.com/package/node-id3 **/
const NodeID3 = require('node-id3');

const isDevelopment = process.env.NODE_ENV !== 'production'

protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true } }
])

function Song(title, filePath, artist, album, albumArtist, cover, trackNumber, mimeType) {
  this.type = "song";
  this.title = title;
  this.filepath = filePath;
  this.artist = artist;
  this.album = album;
  this.albumartist = albumArtist;
  this.trackNumber = trackNumber;
  this.mimetype = mimeType;
}

function Album(title, albumArtist, coverArt) {
  this.type = "album";
  this.title = title;
  this.albumArtist = albumArtist;
  this.coverArt = coverArt;
}

async function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {

      nodeIntegration: process.env.ELECTRON_NODE_INTEGRATION,
      contextIsolation: !process.env.ELECTRON_NODE_INTEGRATION,
      enableRemoteModule: true
    }
  })

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    await win.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
    if (!process.env.IS_TEST) win.webContents.openDevTools()
  } else {
    createProtocol('app')
    await win.loadURL('app://./index.html')
  }
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow().then(() => {})
})

app.on('ready', async () => {
  if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
    try {
      await installExtension(VUEJS3_DEVTOOLS)
    } catch (e) {
      console.error('Vue Devtools failed to install:', e.toString())
    }
  }
  await createWindow()
})

if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', (data) => {
      if (data === 'graceful-exit') {
        app.quit()
      }
    })
  } else {
    process.on('SIGTERM', () => {
      app.quit()
    })
  }
}

electron.ipcMain.handle('open-single-file-and-play', async (event, path) => {
  path = path.filePaths[0]
  console.log(path)
  event.sender.send('play-data', { data: dataurl.convert({ data: fs.readFileSync(path), mimetype: "audio/mp3"}) })
})

electron.ipcMain.handle('scan-folder-and-add', async (event, path) => {
  new Promise(() => {
    console.log(path.filePaths);
    path.filePaths.forEach((pathString) => {
      console.log(pathString);
      if (fs.statSync(pathString).isDirectory()){
        recursiveAddFolder(pathString)
      } else {
        addFile(pathString)
      }
    })
  }).then()
})

electron.ipcMain.handle('get-album-list', async (event) => {
  console.log("Getting album list...");
  getAllAlbums().then((res) => {
    event.sender.send('refresh-albums', res);
  })
})

function recursiveAddFolder(parentFolderPath, index = 0) {
  fs.readdir(parentFolderPath, async (err, files) => {
    if (index < files.length) {
      let pathString = files[index];
      parsePath(parentFolderPath, pathString).then(() => {recursiveAddFolder(parentFolderPath, index + 1)})
    }
  })
}

function parsePath(path, pathString) {
  return new Promise((resolve) => {
    pathString = path.concat('\\').concat(pathString)
    console.log(pathString);
    if (fs.statSync(pathString).isDirectory()) {
      console.log("Determined to be a directory.")
      recursiveAddFolder(pathString)
      resolve()
    } else {
      console.log("Determined to be a file.")
      addFile(pathString).then (() => {
        console.log("File processed.");
        resolve()
      })
    }
  })
}

async function getAllSongs() {
  datastore.find({type: "song"}).then((res) => {return res;});
}

function getAllAlbums() {
  return new Promise((resolve => {
    datastore.find({type: "album"}).then((res) => {resolve(res);});
  }))
}

function addFile(path) {
  return new Promise((resolve) => {
    let isMusicFile = false;
    let mime = "";
    if (path.toLowerCase().endsWith(".mp3")) {
      mime = "audio/mp3";
      isMusicFile = true;
    }
    if (path.toLowerCase().endsWith(".m4a")) {
      isMusicFile = true;
    }
    if (path.toLowerCase().endsWith(".flac")) {
      isMusicFile = true;
    }
    if (path.toLowerCase().endsWith(".wav")) {
      isMusicFile = true;
    }
    if (path.toLowerCase().endsWith(".ogg")) {
      isMusicFile = true;
    }
    if (isMusicFile) {
      const tags = NodeID3.read(path);
      //console.log(tags.raw);
      let songObject = new Song(tags.title, path, tags.artist, tags.album, tags.raw.TPE2, undefined, tags.trackNumber, mime)
      if (songObject.albumartist === undefined || songObject.albumartist === "") {
        songObject.albumartist = songObject.artist;
      }
      console.log(songObject)
      datastore.find({type: "song", title: songObject.title, artist: songObject.artist, album: songObject.album}).then((res) => {
        if (res.length > 0) {
          console.log("Song exists.")
          resolve();
        } else {
          datastore.insert(songObject).then(() => {
            console.log(`Inserted (${songObject.title}) by (${songObject.artist}) on (${songObject.album})`);

            addAlbumIfNotExists(new Album(songObject.album, songObject.albumartist, bufferToDataUrl(tags.raw.APIC.mime, tags.raw.APIC.imageBuffer))).then(() => {
              resolve();
            })
          })
        }
      })
    } else {
      console.log("Not a music file.")
      resolve();
    }
  })
}
function addAlbumIfNotExists(album) {
  return new Promise((resolve) => {
    datastore.find({type: "album", title: album.title, albumArtist: album.albumArtist}).then((res) => {
      if (res.length > 0) {
        console.log("Album exists.")
      } else {
        datastore.insert((album)).then(() => {
        })
        console.log("Album does not exist in db.")
      }
    }).then(resolve)
  })
}
