<template>
  <div id="app">
    <Navigation></Navigation>
    <router-view></router-view>
  </div>
</template>

<script>
  import Navigation from './Nav.vue'
  export default {
    name: 'app',
    components: {
      'Navigation': Navigation
    }
  }
</script>
