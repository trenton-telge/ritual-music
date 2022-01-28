<template>
  <div class="library">
    <div v-if="viewState === 'albums'" class="albums">
      <div v-for="(album) in albums" :key="album._id" class="album-card">
        <img v-if="album.coverArt === undefined" v-on:click="expandAlbum(album)" src="../assets/placeholder.png" />
        <img v-else :src="album.coverArt" v-on:click="expandAlbum(album)" :alt="album.title">
        <p>{{album.title}}</p>
        <p>{{album.albumArtist}}</p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Library',
  props: ['albums', 'viewState'],
  methods: {
    playAlbum: function(album) {
      console.log(`Clicked play on album ${album.title} by ${album.albumArtist}`);
      this.$emit('play-album', album)
    },
    expandAlbum: function(album) {
      console.log(`Expanding album ${album.title} by ${album.albumArtist}`);
      this.$emit('expand-album', album)
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.library {
  flex: 1;
  overflow-y: auto;
  height: calc(100vh - 208px);
  min-width: 100vw;
  width: 100vw;
  display: flex;
  flex-direction: row;
  padding: 20px;
}
.albums {
  flex: 1;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  width: 100%;
  justify-content: center;
  padding-bottom: 200px;
  padding-left: calc(2vw + 30px);
  padding-right: calc(2vw + 30px);
}
.album-card {
  box-shadow: 0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23);
  margin: 6px;
  max-width: 260px;
  max-height: 360px;
}
.album-card img {
  max-width: 260px;
}
</style>
