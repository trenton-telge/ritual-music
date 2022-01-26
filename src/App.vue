<template>
  <div id="content">
    <audio id="player">
      <source id="source" :src="audioData"/>
    </audio>
    <Header @addfiles="addFiles" />
    <Library :albums="albums" @play-album="playAlbum" />
    <Controls/>
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
    refreshAlbums: function() {
      ipcRenderer.invoke('get-album-list');
    },
    setAlbumArray: function(albums) {
      this.albums = albums;
      console.log(this.albums);
    },
    playAlbum: function(album) {
      ipcRenderer.invoke('add-album-to-front-of-playlist-and-play', JSON.stringify(album))
    }
  },
  mounted: function () {
    this.$nextTick(function () {
      this.refreshAlbums();
      ipcRenderer.on('play-data', async function (evt, message) {
        //console.log(message.data);
        //new Audio(message.data).play();
        const player = document.getElementById('player');
        const source = document.getElementById('source');
        player.pause();
        new Promise((resolve => {
          source.setAttribute('src', message.data); resolve();
        })).then(() => {
          player.load();
          player.play().then(() => {});
        })
      });
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
#player {
  display: none;
}
</style>
