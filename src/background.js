'use strict'

import electron, {app, BrowserWindow, protocol} from 'electron'
import {createProtocol} from 'vue-cli-plugin-electron-builder/lib'
import installExtension, {VUEJS3_DEVTOOLS} from 'electron-devtools-installer'
import dataurl from "dataurl";
import fs from "fs";
/*const Store = require('electron-store');
const store = new Store();*/

const isDevelopment = process.env.NODE_ENV !== 'production'

protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true } }
])

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
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
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
  console.log(path.filePaths);
  path.filePaths.forEach((pathString) => {
    console.log(pathString);
    if (fs.statSync(pathString).isDirectory()){
      recursiveAddFolder(pathString)
    } else {
      addFile(pathString)
    }
  })
})

function recursiveAddFolder(path) {

}

function addFile(path) {

}
