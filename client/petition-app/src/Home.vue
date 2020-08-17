<template>
  <div id="mainMenu">
    <h1>Make it Happen</h1>
    <button class="menuButton" @click="$router.push('petitions')">Petitions</button><br>
    <button v-if="token === null" class="menuButton" @click="$router.push('register')">Register</button>
  </div>
</template>

<script>
    export default {
      data() {
        return {
          token: null
        }
      },
      mounted: function () {
        this.token = sessionStorage.getItem('token');
      }
    }
</script>

<style scoped>
  @import './styles.css';
</style>
