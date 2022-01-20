<template>
  <div id="content">
    <Header @addfiles="addFiles" />
    <Library/>
    <Controls/>
  </div>
</template>

<script>
import Library from './components/Library.vue'
import Header from "@/components/Header";
import Controls from "@/components/Controls";
import {ipcRenderer} from "electron";

export default {
  name: 'App',
  components: {
    Header,
    Library,
    Controls
  },
  methods: {
    addFiles: function () {
      const { dialog } = require('electron').remote;
      dialog.showOpenDialog({ properties: ["openFile", "openDirectory", "multiSelections", "dontAddToRecent"] }).then((result) => ipcRenderer.invoke('scan-folder-and-add', result))
    },
    playFile: function () {
      const { dialog } = require('electron').remote;
      dialog.showOpenDialog({ properties: ["openFile", "dontAddToRecent"] }).then((result) => ipcRenderer.invoke('open-single-file-and-play', result))
    },
  }
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
}
audio {
  display: none;
}
#app {
  font-family: Roboto, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}
#content {
  width: 100%;
  height: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: stretch;
  align-content: space-between;
}
</style>
