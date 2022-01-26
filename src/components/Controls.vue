<template>
  <div class="audio-controls">
    <div class="controls-left">
      <div class="song-details">
        <img v-if="isPlaying" id="cover-art" :src="metadata.coverArt" alt="Now Playing" />
        <div v-if="isPlaying" class="text-details">
          <p class="song-title">{{metadata.title}}</p>
          <p class="song-details"><span v-on:click="goToArtist(metadata.artist)">{{metadata.artist}}</span>&nbsp;-&nbsp;<span v-on:click="goToAlbum(metadata.album, metadata.albumArtist)">{{metadata.album}}</span></p>
        </div>
      </div>
    </div>
    <div class="controls-center">
      <i v-on:click="toggleRepeat" class="fas fa-retweet"></i>
      <i v-on:click="back" class="fas fa-step-backward"></i>
      <span>
        <i v-if="isPlaying" v-on:click="pause" class="fas fa-pause"></i>
        <i v-else v-on:click="play" class="fas fa-play"></i>
      </span>
      <i v-on:click="next" class="fas fa-step-forward"></i>
      <i v-on:click="toggleShuffle" class="fas fa-random"></i>
    </div>
    <div class="controls-right">
      <i v-on:click="volDown" class="fas fa-volume-down"></i>
      <i v-on:click="volUp" class="fas fa-volume-up"></i>
    </div>
  </div>
</template>

<script>
export default {
  name: "Controls",
  props: ['metadata'],
  computed: {
  },
  data() {
    return {
      isPlaying: false,
      coverArt: "../assets/placeholder.png",
    }
  },
  methods: {
    pause: function() {
      console.log("Paused");
      this.$emit('pause');
      this.isPlaying = false;
    },
    play: function() {
      console.log("Playback resumed");
      this.$emit('play');
      this.isPlaying = true;
    },
    back: function() {},
    next: function() {
      this.$emit('next-track');
    },
    toggleRepeat: function() {},
    toggleShuffle: function() {},
    volUp: function() {
      this.$emit('vol-up');
    },
    volDown: function() {
      this.$emit('vol-down');
    },
    goToAlbum: function(album, albumArtist) {
      this.$emit('go-to-album', {title: album, albumArtist: albumArtist});
    },
    goToArtist: function(artist) {
      this.$emit('go-to-artist', {artist: artist});
    }
  },
  mounted: function() {
    this.$nextTick(function () {

    });
  }
}
</script>

<style scoped>
.audio-controls {
  min-width: 100vw;
  max-width: 100vw;
  width: 100vw;
  min-height: 100px;
  height:12vh;
  box-shadow: 0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23);
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  justify-content: space-between;
  align-items: center;
}
.audio-controls * {
  flex-direction: row;
  display: flex;
}
.controls-left, .controls-right {
  width: 20vw;
  min-width: 20vw;
  max-width: 20vw;
}
.controls-left {
  justify-content: flex-start;
}
.controls-right {
  justify-content: flex-end;
}
.controls-center {
  justify-content: center;
}
#cover-art {
  min-height: 100%;
  max-height: 100%;
  height: 12vh;
  background-color: #2c3e50;
}
.fas {
  font-size: 24pt;
  padding: 8px;
  border-radius: 4px;
  background-color: transparent;
  margin: 2px;
  transition: background-color .3s;
}
.fas:hover {
  background-color: lightgrey;
}
.fas:active {
  background-color: darkgray;
}
.fa-volume-up {
  margin-right: 30px;
}
.text-details {
  display: flex;
  flex-direction: column;
  justify-content: center;
  margin-left: 10px;
}
.text-details p {
  margin: 0;
}
.song-title {
  font-family: Roboto, Helvetica, Arial, sans-serif;
  font-weight: bold;
}
.song-details {
  font-family: Roboto, Helvetica, Arial, sans-serif;
}
</style>
