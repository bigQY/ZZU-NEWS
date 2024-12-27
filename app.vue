<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtPage />
  </div>
</template>

<script setup>
import { useSeoMeta } from 'unhead'

useSeoMeta({
  title: '郑州大学大新闻',
  ogTitle: '郑州大学大新闻',
  description: '郑州大学大新闻是一个自由的新闻媒体平台，提供最新的新闻和资讯。',
  ogDescription: '郑州大学大新闻是一个自由的新闻媒体平台，提供最新的新闻和资讯。',
  ogImage: 'https://www.zzu.edu.cn/images/dhbanner/zsjy.jpg',
  ogType: 'website',
  ogUrl: 'https://zzu.news',
  ogSiteName: '郑州大学大新闻',
  keywords: '郑州大学, 新闻, 自媒体, 最新新闻, 资讯'
})

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
    .catch((error) => {
      console.error('Error during service worker registration:', error)
    })
}
</script>
<style>
body {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  margin: 0;
  padding: 0;
}
</style>
