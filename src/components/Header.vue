<template>
  <div class="header-wrapper">
    <div class="header-group-left">
      <i class="fas fa-bars"></i>
    </div>
    <div class="header-group-center">
      <input type="text" class="search-bar" placeholder="Search">
    </div>
    <div class="header-group-right">
      <i class="fas fa-plus-square" v-on:click="openFile"></i>
      <i class="fas fa-cog"></i>
    </div>
  </div>
  <audio ref="player" :src="audioSource" autoplay></audio>
</template>

<script>
import { ipcRenderer } from 'electron';
export default {
  name: "Header",
  methods: {
    openFile: function () {
      const { dialog } = require('electron').remote;
      dialog.showOpenDialog({ properties: ['openFile'] }).then((result) => ipcRenderer.invoke('open-single-file-and-play', result))
    }
  },
  computed: {
    audioSource: ""
  },
  mounted: function () {
    this.$nextTick(function () {
      ipcRenderer.on('play-data', function (evt, message) {
        console.log(message.data);
        new Audio(message.data).play();
      });
    });
  }
}
</script>

<style scoped>
  .header-wrapper {
    display: flex;
    width: 100vw;
    max-width: 100vw;
    min-width: 100vw;
    min-height: 80px;
    box-shadow: 0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23);
    justify-content: space-between;
    align-items: center;
  }
  .header-group-left, .header-group-right {
    min-width: 200px;
    max-width: 200px;
    display: flex;
    align-items: center;
    min-height: 100%;
  }
  .header-group-left {
    justify-content: flex-start;
  }
  .header-group-right {
    justify-content: flex-end;
  }
  .fas {
    font-size: 24pt;
    padding: 8px;
    border-radius: 4px;
    background-color: transparent;
    margin: 2px;
    transition: background-color .3s;
  }
  .fa-bars {
    margin-left: 20px;
  }
  .fa-cog {
    margin-right: 20px;
  }
  .fas:hover {
    background-color: lightgrey;
  }
  .fas:active {
    background-color: darkgray;
  }
  .search-bar {
    background-color: lightgrey;
    padding: 4px 10px;
    border-radius: 4px;
    border: none;
  }
</style>
