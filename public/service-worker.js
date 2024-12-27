const CACHE_NAME = 'CACHE_NAME_PLACEHOLDER'

// 安装 Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker installing.')
  self.skipWaiting() // 强制等待中的 Service Worker 成为激活状态
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
  self.clients.claim() // 立即接管所有页面
})

// 拦截请求并缓存资源
self.addEventListener('fetch', (event) => {
  // 排除 POST 请求、带有 'api' 的请求和带参数的 GET 请求
  if (
    event.request.method !== 'POST' &&
    !event.request.url.includes('/api/') &&
    !event.request.url.includes('?') &&
    event.request.url.startsWith('http')
  ) {
    // 只处理正常网页的请求，并排除特定的 URL 模式
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse
        }
        return fetch(event.request)
          .then((response) => {
            const clonedResponse = response.clone()
            const contentType = response.headers.get('Content-Type')
            if (
              event.request.url.endsWith('.js') ||
              event.request.url.endsWith('.css') ||
              event.request.url.match(/\.(png|jpg|jpeg|gif|ico)$/) ||
              (contentType && contentType.includes('text/html'))
            ) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, clonedResponse)
              })
            }
            return response
          })
          .catch((error) => {
            console.error('Fetch failed; returning offline page instead.', error)
          })
      })
    )
  }
})
