<template>
  <div id="content">
    <audio id="player">
      <source id="source" :src="audioData"/>
    </audio>
    <Header @addfiles="addFiles" @back="back" />
    <Library v-if="viewState === 'library'" :view-state="libraryState" :albums="albums" @play-album="playAlbum" @expand-album="expandAlbum" />
    <Album v-if="viewState === 'album'" :album="zoomedAlbum" :songs="zoomedData" @play-song="playSong" @play-album="playAlbum" />
    <Controls :metadata="metadata" :isPlaying="isPlaying" @play="resumePlayback" @pause="pausePlayback" @next-track="playNextIfAvailable" @vol-up="volumeUp" @vol-down="volumeDown"/>
  </div>
</template>

<script>
import {ipcRenderer} from "electron";
import Header from "@/components/Header";
import Controls from "@/components/Controls";
import Library from "@/components/Library";
import Album from "@/components/Album";

export default {
  name: 'App',
  components: {
    Album,
    Library,
    Header,
    Controls,
  },
  data() {
    return {
      viewState: 'library',
      libraryState: 'albums',
      isPlaying: false,
      audioData: "",
      metadata: undefined,
      albums: [{title: "titlehere", albumArtist: "albumartisthere"}],
      zoomedAlbum: {title: "", albumArtist: ""},
      zoomedData: undefined
    }
  },
  methods: {
    back: function() {
      this.viewState = "library";
    },
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
      this.isPlaying = true;
    },
    pausePlayback: function () {
      document.getElementById('player').pause();
      this.isPlaying = false;
    },
    refreshAlbums: function() {
      ipcRenderer.invoke('get-album-list');
    },
    setAlbumArray: function(albums) {
      this.albums = albums;
      console.log(this.albums);
    },
    expandAlbum: function(album) {
      console.log(album);
      ipcRenderer.invoke('get-album-songs', JSON.stringify(album));
    },
    openAlbumWithSongs: function(album, songs) {
      this.zoomedAlbum = JSON.parse(album);
      this.zoomedData = songs;
      this.viewState = 'album';
    },
    playAlbum: function(album) {
      ipcRenderer.invoke('add-album-to-front-of-playlist-and-play', JSON.stringify(album));
    },
    playSong: function (song) {
      ipcRenderer.invoke('add-song-to-front-of-playlist-and-play', JSON.stringify(song));
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
        //vm.isPlaying = false;
        new Promise((resolve => {
          source.setAttribute('src', message.data);
          resolve();
        })).then(() => {
          player.load();
          player.play().then(() => {
            vm.isPlaying = true;
          });
        })
        vm.metadata = message.metadata;
      });
      ipcRenderer.on('refresh-albums', function (evt, message) {
        vm.setAlbumArray(message)
      });
      ipcRenderer.on('end-of-playlist', function () {
        document.getElementById('player').pause();
        vm.isPlaying = false;
      });
      ipcRenderer.on('open-album-with-songs', function(evt, data) {
        console.log(data)
        vm.openAlbumWithSongs(data.album, data.songs);
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
