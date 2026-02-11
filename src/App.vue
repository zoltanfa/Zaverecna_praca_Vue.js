<script setup>
import Header from '@/components/Header.vue'
import Footer from '@/components/Footer.vue'
</script>


<template>
  <div class="app">
    <Header />
    <div class="content">
      <router-view />
    </div>
    <Footer />
  </div>
</template>


<style>
body {
  margin: 0;
  min-height: 100vh;
  font-family: Arial, sans-serif;
  box-sizing: border-box;
}

* {
  box-sizing: border-box;
}

.app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.content {
  flex: 1;
  width: 100%;
}

main {
  padding-bottom: 60px;
}
</style>