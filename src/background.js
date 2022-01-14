'use strict'

import { app, protocol, BrowserWindow } from 'electron'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
import installExtension, { VUEJS3_DEVTOOLS } from 'electron-devtools-installer'
import {mkdtemp} from "fs/promises";
import path from "path";
import os from "os";
import {exec} from "child_process";
import fs from "fs";
import wav from "node-wav";
const Store = require('electron-store');
const store = new Store();
const isDevelopment = process.env.NODE_ENV !== 'production'

let pathToFfmpeg = store.get("ffmpeg");
if (pathToFfmpeg === undefined) {

}
pathToFfmpeg = "C:\\Program Files\\ffmpeg-2022-01-13-git-c936c319bd-full_build\\bin\\ffmpeg.exe"
console.log(pathToFfmpeg);

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true } }
])

async function createWindow() {
  // Create the browser window.
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {

      // Use pluginOptions.nodeIntegration, leave this alone
      // See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
      nodeIntegration: process.env.ELECTRON_NODE_INTEGRATION,
      contextIsolation: !process.env.ELECTRON_NODE_INTEGRATION
    }
  })

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    await win.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
    if (!process.env.IS_TEST) win.webContents.openDevTools()
  } else {
    createProtocol('app')
    // Load the index.html when not in development
    await win.loadURL('app://./index.html')
  }
}

async function transcodeToWav(filename) {
  const TEMP_DIR = await mkdtemp(path.join(os.tmpdir(), "transcoder-storage-"));
  return new Promise((resolve, reject) => {
    let output_filename = `${path.join(TEMP_DIR, filename.substr(filename.lastIndexOf("\\")))}.wav`;
    // "shell out" to ffmpeg
    exec(
        `\"${pathToFfmpeg}\" -i \"${filename}\" \"${output_filename}\"`,
        (error, stdout, stderr) => {
          if (error) {
            console.log("ERROR: ", error);
            reject(error);
          }
          resolve({ filename: output_filename, stdout, stderr });
        }
    );
  });
}

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
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

  try {
    let result = await transcodeToWav("F:\\Music\\01 Assumption.mp3");
    // result.filename is the new filename of the transcoded audio.
    // We can now use node-wav as described above to read the audio

    let buffer = fs.readFileSync(result.filename);
    let decodedAudio = wav.decode(buffer);
    console.log(decodedAudio.sampleRate);
    console.log(decodedAudio.channelData); // array of Float32Arrays
    const player = require('node-wav-player');
    player.play({
      path: result.filename,
      sync: true
    }).then(() => {
      console.log('The wav file started to be played successfully.');
    }).catch((error) => {
      console.error(error);
    });
  } catch {console.log("err")}

})

// Exit cleanly on request from parent process in development mode.
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
