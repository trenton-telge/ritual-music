'use strict'

import electron, {app, BrowserWindow, ipcRenderer, protocol} from 'electron'
import {createProtocol} from 'vue-cli-plugin-electron-builder/lib'
import installExtension, {VUEJS3_DEVTOOLS} from 'electron-devtools-installer'
import dataurl from "dataurl";
import fs, {realpathSync} from "fs";
import bufferToDataUrl from "buffer-to-data-url";
/*const Store = require('electron-store');
const store = new Store();*/
// const Datastore = require('nedb-promises')
import Datastore from 'nedb-promises';
let datastore = Datastore.create({filename: './library.db', autoload: true});
/** https://www.npmjs.com/package/node-id3 **/
import NodeID3 from "node-id3";
// const NodeID3 = require('node-id3');
import FLAC from 'flac-parser';
// const FLAC = require('flac-parser');

const isDevelopment = process.env.NODE_ENV !== 'production'

let activePlaylist = [];
let win = undefined;

protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true } }
])

function Song(title, filePath, artist, album, albumArtist, cover, trackNumber, mimeType) {
  this.type = "song";
  this.title = title;
  this.filepath = filePath;
  this.artist = artist;
  this.album = album;
  this.albumArtist = albumArtist;
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
  win = new BrowserWindow({
    width: 2600,
    minWidth: 800,
    height: 1200,
    minHeight: 800,
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

electron.ipcMain.handle('add-album-to-front-of-playlist-and-play', (event, album) => {
  addAlbumToPlaylistAndPlay(event, JSON.parse(album));
})

electron.ipcMain.handle('add-song-to-front-of-playlist-and-play', (event, song) => {
  addSongToPlaylistAndPlay(event, JSON.parse(song));
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

electron.ipcMain.handle('get-album-songs', (event, album) => {
  getSongsByAlbum(JSON.parse(album)).then((res) => {
    console.log(res);
    const data = {album: album, songs: res};
    event.sender.send('open-album-with-songs', data);
  })
})

electron.ipcMain.handle('get-album-list', async (event) => {
  console.log("Getting album list...");
  getAllAlbums().then((res) => {
    event.sender.send('refresh-albums', res);
  })
})

electron.ipcMain.handle('play-next-if-available', async (event) => {
  activePlaylist.shift();
  if (activePlaylist.length > 0) {
    playInApp(event, activePlaylist[0]);
  } else {
    event.sender.send('end-of-playlist');
  }
})

function addAlbumToPlaylistAndPlay(event, album) {
  getSongsByAlbum(album).then((res) => {
    activePlaylist = res.concat(activePlaylist);
    playInApp(event, activePlaylist[0]);
  })
}

function addSongToPlaylistAndPlay(event, song) {
  activePlaylist = Array.of(song).concat(activePlaylist);
  playInApp(event, activePlaylist[0]);
}

function playInApp(event, song) {
  getAlbumArt(song.album, song.artist).then((res) => {
    song.coverArt = res;
    event.sender.send('play-data', {data: dataurl.convert({data: fs.readFileSync(song.filepath), mimetype: song.mimetype}), metadata: song})
  })
}

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

function getSongsByAlbum(album){
  return new Promise((resolve => {
    datastore.find({type: "song", album: album.title, albumArtist: album.albumArtist}).then((res) => {
      console.log(res)
      resolve(res.sort((a, b) => (a.trackNumber > b.trackNumber) ? 1 : -1));
    })
  }))
}

function getAlbumArt(title, artist) {
  return new Promise((resolve) => {
    datastore.find({type: "album", title: title, albumArtist: artist}).then((res) => {
      if (res.length > 0) {
        resolve(res[0].coverArt);
      }
    })
  })
}

function addFile(path) {
  return new Promise((resolve) => {
    let isMusicFile = false;
    let mime="";
    let songObject;
    if (path.toLowerCase().endsWith(".mp3")) {
      isMusicFile = true;
      mime = "audio/mp3"
      const tags = NodeID3.read(path);
      //console.log(tags.raw);
      songObject = new Song(tags.title, path, tags.artist, tags.album, tags.raw.TPE2, undefined, tags.trackNumber, mime)
      if (songObject.albumArtist === undefined || songObject.albumArtist === "") {
        songObject.albumArtist = songObject.artist;
      }
      if (songObject.trackNumber !== undefined) {
        if (songObject.trackNumber.includes('/')) {
          songObject.trackNumber = parseInt(songObject.trackNumber.substr(0, songObject.trackNumber.indexOf('/')));
        }
        else {
          songObject.trackNumber = parseInt(songObject.trackNumber);
        }
      }
      datastore.find({type: "song", title: songObject.title, artist: songObject.artist, album: songObject.album}).then((res) => {
        if (res.length > 0) {
          console.log("Song exists.")
          resolve();
        } else {
          datastore.insert(songObject).then(() => {
            console.log(`Inserted (${songObject.title}) by (${songObject.artist}) on (${songObject.album})`);
            addAlbumIfNotExists(new Album(songObject.album, songObject.albumArtist, (tags.raw.APIC !== undefined) ? bufferToDataUrl(tags.raw.APIC.mime, tags.raw.APIC.imageBuffer) : undefined)).then(() => {
              resolve();
            })
          })
        }
      })
    }
    if (path.toLowerCase().endsWith(".m4a")) {
      isMusicFile = true;
      mime = "audio/mp4"
    }
    if (path.toLowerCase().endsWith(".flac")) {
      isMusicFile = true;
      mime = "audio/flac";
      let tags = [], songObject;
      new Promise((resolve) => {
        let stream = fs.createReadStream(path).pipe(new FLAC());
        stream.on('data', function(tag){
          tags.push(tag);
        })
        stream.on('finish', function (){
          resolve();
        })
      }).then(function(){
        songObject = new Song(findTagInArray('title', tags), path, findTagInArray('artist', tags), findTagInArray('album', tags), findTagInArray('artist', tags), undefined,findTagInArray('tracknumber', tags), mime)
        if (songObject.trackNumber !== undefined) {
          if (songObject.trackNumber.includes('/')) {
            songObject.trackNumber = parseInt(songObject.trackNumber.substr(0, songObject.trackNumber.indexOf('/')));
          }
          else {
            songObject.trackNumber = parseInt(songObject.trackNumber);
          }
        }
        datastore.find({type: "song", title: songObject.title, artist: songObject.artist, album: songObject.album}).then((res) => {
          if (res.length > 0) {
            console.log("Song exists.")
            resolve();
          } else {
            datastore.insert(songObject).then(() => {
              console.log(`Inserted (${songObject.title}) by (${songObject.artist}) on (${songObject.album})`);
              addAlbumIfNotExists(new Album(songObject.album, songObject.albumArtist, undefined)).then(() => {
                resolve();
              })
            })
          }
        })
        console.log(songObject)
      })
    }
    if (path.toLowerCase().endsWith(".wav")) {
      isMusicFile = true;
    }
    if (path.toLowerCase().endsWith(".ogg")) {
      isMusicFile = true;
    }
    if (isMusicFile) {
      //console.log(songObject)
    } else {
      console.log("Not a music file.")
      resolve();
    }
  })
}

function findTagInArray(name, array) {
  let i = 0;
  while (i < array.length) {
    if (array[i].type === name) {
      return array[i].value;
    }
    i++;
  }
  return undefined;
}

function addAlbumIfNotExists(album) {
  return new Promise((resolve) => {
    datastore.find({type: "album", title: album.title, albumArtist: album.albumArtist}).then((res) => {
      if (res.length > 0) {
        console.log("Album exists.")
        resolve();
      } else {
        datastore.insert((album)).then(() => {
          console.log(`Inserted album (${album.title}) by (${album.albumArtist})`)
          getAllAlbums().then((res) => {
            setAlbumColorScheme(album);
            win.webContents.send('refresh-albums', res);
            resolve();
          })
        })
      }
    })
  })
}

function setAlbumColorScheme(album) {
  if (album.coverArt !== undefined) {

  }
}
