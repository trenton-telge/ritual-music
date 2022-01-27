<template>
  <div id="content">
    <audio id="player">
      <source id="source" :src="audioData"/>
    </audio>
    <Header @addfiles="addFiles" />
    <Library :albums="albums" @play-album="playAlbum" />
    <Controls :metadata="metadata" @play="resumePlayback" @pause="pausePlayback" @next-track="playNextIfAvailable" @vol-up="volumeUp" @vol-down="volumeDown"/>
  </div>
</template>

<script>
import Header from "@/components/Header";
import Controls from "@/components/Controls";
import {ipcRenderer} from "electron";
import Library from "@/components/Library";

export default {
  name: 'App',
  components: {
    Library,
    Header,
    Controls
  },
  data() {
    return {
      audioData: "",
      metadata: undefined,
      albums: [{title: "titlehere", albumartist: "albumartisthere"}]
    }
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
    resumePlayback: function () {
      document.getElementById('player').play();
    },
    pausePlayback: function () {
      document.getElementById('player').pause();
    },
    refreshAlbums: function() {
      ipcRenderer.invoke('get-album-list');
    },
    setAlbumArray: function(albums) {
      this.albums = albums;
      console.log(this.albums);
    },
    playAlbum: function(album) {
      ipcRenderer.invoke('add-album-to-front-of-playlist-and-play', JSON.stringify(album));
    },
    volumeUp: function () {
      console.log('up')
      let currentVolume = document.getElementById('player').volume
      if (currentVolume + .05 <= 1) {document.getElementById('player').volume = currentVolume + .05;}
    },
    volumeDown: function () {
      console.log('down')
      let currentVolume = document.getElementById('player').volume
      if (currentVolume - .05 >= 0) {document.getElementById('player').volume = currentVolume - .05;}
    },
    playNextIfAvailable: function() {
      ipcRenderer.invoke('play-next-if-available');
    }
  },
  mounted: function () {
    this.$nextTick(function () {
      let vm = this;
      this.refreshAlbums();
      document.getElementById('player').addEventListener('ended', function(){
        vm.playNextIfAvailable();
      });
      ipcRenderer.on('play-data', function (evt, message) {
        const player = document.getElementById('player');
        const source = document.getElementById('source');
        player.pause();
        new Promise((resolve => {
          source.setAttribute('src', message.data); resolve();
        })).then(() => {
          player.load();
          player.play().then(() => {});
        })
        vm.metadata = message.metadata;
      });
      ipcRenderer.on('refresh-albums', function (evt, message) {
        vm.setAlbumArray(message)
      })
      new Promise((resolve => {
        ipcRenderer.on('refresh-albums', function (evt, message) {
          resolve(message);
        });
      })).then((message)=> {this.setAlbumArray(message);});
    });
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
#content {
  width: 100%;
  height: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: stretch;
  align-content: space-between;
  overflow-x: hidden;
  font-family: Roboto, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}
#player {
  display: none;
}
</style>
