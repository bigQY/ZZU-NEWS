const CACHE_NAME = 'CACHE_NAME_PLACEHOLDER'

// 安装 Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker installing.')
  self.skipWaiting()
})

// 激活 Service Worker 并清理旧缓存
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating.')
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Clearing old cache')
            return caches.delete(cache)
          }
        })
      )
    })
  )
  return self.clients.claim()
})

// 拦截请求并缓存资源
self.addEventListener('fetch', (event) => {
  console.log('Fetching:', event.request.url)
  if (
    event.request.url.startsWith('http') &&
    !event.request.url.includes('_nuxt') &&
    !event.request.url.includes('node_modules')
  ) {
    // 只处理正常网页的请求，并排除特定的 URL 模式
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse
        }
        return fetch(event.request).then((response) => {
          const clonedResponse = response.clone()
          if (
            event.request.url.endsWith('.js') ||
            event.request.url.endsWith('.css') ||
            event.request.url.match(/\.(png|jpg|jpeg|gif)$/)
          ) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, clonedResponse)
            })
          }
          return response
        })
      })
    )
  }
})
