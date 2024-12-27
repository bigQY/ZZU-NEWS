<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtPage />
  </div>
</template>
<script setup>
if (import.meta.client && import.meta.env.MODE !== 'development' && 'serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('/service-worker.js', { updateViaCache: 'none' })
    .then((registration) => {})
    .catch((error) => {})
}
</script>
<style>
body {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  margin: 0;
  padding: 0;
}
</style>
