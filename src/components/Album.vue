<template>
  <div class="expanded-album">
    <div class="album-details">
      <img v-if="album.coverArt !== undefined" class="cover-art" :src="album.coverArt" :alt="album.title" />
      <img v-else class="cover-art" src="../assets/placeholder.png" :alt="album.title" />
      <div class="text-details-container">
        <div class="title-container">
          <h2>{{album.title}}</h2>
          <i class="far fa-play-circle" v-on:click="playAlbum(album)"></i>
        </div>
        <p>{{album.albumArtist}}</p>
      </div>
    </div>
    <div class="tracklist">
      <div class="tracks-table">
        <div class="tracks-row tracks-header">
          <div class="tracks-data td-num">#</div>
          <div class="tracks-data td-title">Name</div>
          <div class="tracks-data td-duration">Duration</div>
          <div class="tracks-data td-playcount">Plays</div>
          <div class="tracks-data td-rating">Rating</div>
          <div class="tracks-data td-play">Play</div>
        </div>
        <div v-for="track in songs" :key="track._id" class="tracks-row" v-on:click="playSong(track)">
          <div class="tracks-data td-num">{{track.trackNumber}}</div>
          <div class="tracks-data td-title">{{track.title}}</div>
          <div class="tracks-data td-duration">-</div>
          <div class="tracks-data td-playcount">-</div>
          <div class="tracks-data td-rating">-</div>
          <div class="tracks-data td-play"><i v-on:click="playSong(track)" class="fas fa-play"></i></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "Album",
  props: ['album', 'songs'],
  methods: {
    playAlbum: function(album) {
      console.log(`Clicked play on album ${album.title} by ${album.albumArtist}`);
      this.$emit('play-album', album)
    },
    playSong: function(song) {
      console.log(`Clicked play on song ${song.title} by ${song.artist} on ${song.album}`)
      this.$emit('play-song', song)
    }
  }
}
</script>

<style scoped>
.expanded-album {
  height: calc(100vh - 208px);
  min-width: 100vw;
  width: 100vw;
  display: flex;
  flex-direction: column;
  padding: 20px;
  overflow-y: auto;
  justify-content: flex-start;
}
.album-details {
  display: flex;
  flex-direction: row;
  min-width: 100%;
  height: 300px;
  padding-top: 20px;
  padding-left: calc(2vw + 180px);
  padding-right: calc(2vw + 180px);
}
.text-details-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  padding-left: 30px;
  flex: 1;
}
.title-container {
  display: flex;
  flex-direction: row;
  width: 100%;
  align-items: center;
}
.far {
  font-size: 24pt;
  padding: 8px;
  border-radius: 4px;
  background-color: transparent;
  margin-top: -12px;
  margin-left: 6px;
  transition: background-color .3s;
}
.far:hover {
  background-color: lightgrey;
}
.far:active {
  background-color: darkgray;
}
.cover-art {
  height: 100%;
  box-shadow: 0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23);
}

.tracklist {
  margin-top: 40px;
  margin-bottom: 30px;
  min-width: 100%;
  padding-left: calc(2vw + 180px);
  padding-right: calc(2vw + 180px);
  display: flex;
  flex-direction: column;
}
.tracks-table {
  box-shadow: 0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23);
  display: flex;
  flex-direction: column;
  padding: 10px 30px;
}
.tracks-row {
  text-align: left;
  padding: 6px;
  display: flex;
  flex-direction: row;
}
.tracks-header {
  font-weight: bold;
}
.tracks-data {
  min-width: 50px;
}
.td-title {
  flex: 1;
}
.td-duration {
  width: 140px;
  flex: .3;
}
.td-playcount {
  width: 50px;
  flex: .15;
}
.td-rating {
  width: 200px;
}
</style>
