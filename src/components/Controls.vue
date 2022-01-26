<template>
  <div class="audio-controls">
    <div class="controls-left">
      <div class="song-details">
        <img v-if="isPlaying" id="cover-art" :src="coverArt" alt="Now Playing" />
        <div v-if="isPlaying" class="text-details">
          <p>{{songTitle}}</p>
          <p>{{artist}} - {{album}}</p>
        </div>
      </div>
    </div>
    <div class="controls-center">
      <i class="fas fa-retweet"></i>
      <i class="fas fa-step-backward"></i>
      <span>
        <i v-if="isPlaying" v-on:click="pause" class="fas fa-pause"></i>
        <i v-else class="fas fa-play"></i>
      </span>
      <i class="fas fa-step-forward"></i>
      <i class="fas fa-random"></i>
    </div>
    <div class="controls-right">
      <i class="fas fa-volume-down"></i>
      <i class="fas fa-volume-up"></i>
    </div>
  </div>
</template>

<script>
export default {
  name: "Controls",
  computed: {
    isPlaying: false,
    coverArt: "../assets/placeholder.png",
    songTitle: "",
    album: "",
    artist: ""
  },
  methods: {
    pause: () => {
      console.log("Paused")
      this.$emit('pause');
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
  height: 100%;
  background-color: #2c3e50;
}
</style>
