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
    .then((registration) => {
      registration.onupdatefound = () => {
        const installingWorker = registration.installing
        installingWorker.onstatechange = () => {
          if (installingWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              // 新的 Service Worker 已经安装完成，页面将被重载
              alert('发现新版本，页面将自动刷新!')
              window.location.reload()
            }
          }
        }
      }
    })
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
