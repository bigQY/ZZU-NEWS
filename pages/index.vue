<template>
  <div>
    <div>
      <!-- 右上角专注模式开关 -->
      <button class="switch-focus" @click="switchFocusMode">
        {{ focusMode ? '退出专注模式' : '进入专注模式' }}
      </button>
    </div>
    <div v-show="!focusMode">
      <div id="head" class="animated-title">
        <h1 id="title">郑州大学大新闻</h1>
        <p id="info">一个<span class="animated-word" style="color: red">自由</span>的新闻媒体</p>
        <div style="margin-top: 50px">
          <a id="publish" @click="publishNew">发布新闻</a>
          <a class="btn" href="#news">查看新闻</a>
        </div>
      </div>
      <div id="submitNewNews" style="width: 100%; text-align: center" v-if="submitOpen">
        <input id="input" v-model="newNewsInput" type="text" placeholder="请输入新闻的IPFS地址" />
        <a class="btn" @click="submitNewNews">提交</a>
      </div>
      <div id="news">
        <!-- 新闻显示 -->
        <NewsItem
          v-for="(news, index) in newList"
          :key="news.id"
          :news="news"
          :isMobile="isMobile"
          :iframeHeight="iframeHeight"
          :onIframeLoad="onIframeLoad"
          style="overflow-y: hidden"
        />
        <div style="width: 100%; text-align: center" v-if="newList.length === 0">
          <div class="loading-container">
            <div class="loading-text">加载中...</div>
          </div>
        </div>
      </div>
    </div>
    <div v-if="focusMode">
      <NewsItem
        :news="newList[focusIndex]"
        :isMobile="isMobile"
        :iframeHeight="iframeHeight"
        :onPageChange="onPageChange"
        iframeScrolling="yes"
        :isFocus="true"
      />
    </div>
    <div v-if="!focusMode" style="width: 100%; text-align: center">
      <a ref="loadMoreTrigger" class="btn" @click="loadMoreNews()">查看更多</a>
    </div>
  </div>
</template>

<script setup>
import NewsItem from '@/components/NewsItem.vue'
import { ref, onMounted, onBeforeUnmount, watchEffect, nextTick, watch } from 'vue'
import { debounce } from 'lodash-es'

const focusMode = ref(false)
const focusIndex = ref(0)

const switchFocusMode = () => {
  focusMode.value = !focusMode.value
  nextTick(() => {
    computeIframeHeight()
  })
}

const handleKeydown = async (event) => {
  if (focusMode.value) {
    if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
      onPageUp()
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
      await onPageDown()
    }
  }
}

const onPageChange = async (action) => {
  if (action === 'pre') {
    onPageUp()
  } else if (action === 'next') {
    await onPageDown()
  } else {
    console.error('非法action')
  }
}

const onPageUp = () => {
  if (focusIndex.value > 0) {
    focusIndex.value--
  } else {
    alert('已经是第一篇了')
  }
}

const onPageDown = async () => {
  if (focusIndex.value < newList.value.length - 1) {
    focusIndex.value++
  } else {
    if (currentPage.value < total.value / currentLimit.value - 1) {
      await loadMoreNews()
    } else {
      alert('已经是最后一篇了')
    }
  }
}

const viewNews = async (url) => {
  const viewedNews = JSON.parse(localStorage.getItem('viewedNews')) || []
  if (!viewedNews.includes(url)) {
    await $fetch('/api/viewNews', {
      method: 'POST',
      body: {
        url
      }
    })
  }
  viewedNews.push(url)
  localStorage.setItem('viewedNews', JSON.stringify(viewedNews))
}

watch(focusIndex, async () => {
  await viewNews(newList.value[focusIndex.value].url)
})

const submitOpen = ref(false)

const publishNew = () => {
  const publishUrl =
    'https://ipfs.zzu.news/ipfs/QmNyiNESEsTVtw5jjwkzZ1nH1auczwgfyFq2LgbAFV9vjM/#ipfs.zzu.news'

  // 创建一个新的窗口
  const newWindow = window.open(publishUrl, '_blank')
  if (!newWindow) {
    alert('请允许弹出窗口')
    return
  }
  // 提示用户在新页面中发布新闻，并将发布之后的连接手动输入会当前页面
  alert(
    '请在新页面中发布新闻\n并将发布之后的连接手动输入会当前页面的输入框\n' +
      '注意：新闻内容使用IPFS存储，发布后不可更改，不可删除'
  )
  submitOpen.value = true
}

const newNewsInput = ref('')
const submitNewNews = async () => {
  if (!newNewsInput.value) {
    alert('请输入新闻的IPFS地址')
    return
  }
  if (
    !newNewsInput.value.startsWith('https://ipfs.zzu.news/ipfs/') ||
    newNewsInput.value.length < 46
  ) {
    alert('请输入正确的IPFS地址')
    return
  }
  if (
    newNewsInput.value ===
    'https://ipfs.zzu.news/ipfs/QmNyiNESEsTVtw5jjwkzZ1nH1auczwgfyFq2LgbAFV9vjM/#ipfs.zzu.news'
  ) {
    alert('请输入正确的IPFS地址, 不能是发布新闻的地址')
    return
  }
  const result = await $fetch('/api/newNews', {
    method: 'GET',
    params: {
      url: newNewsInput.value
    }
  })
  submitOpen.value = false
}

const newList = ref([])
const loadedIndex = ref(0)
const maxLoadedIndex = ref(3) // 最多同时允许3个iframe加载
const onIframeLoad = (event) => {
  loadedIndex.value++
  if (loadedIndex.value < newList.value.length) {
    maxLoadedIndex.value++
  }
}
const onIframeError = (event) => {
  console.error('iframe加载失败', event)
  loadedIndex.value++
  if (loadedIndex.value < newList.value.length) {
    maxLoadedIndex.value++
  }
}

onMounted(() => {
  // 初始化加载第一个 iframe
  loadNews()
  if (newList.value.length > 0) {
    loadedIndex.value = 0
  }
})
const currentPage = ref(0)
const currentLimit = ref(100)
const total = ref(1)

const loadNews = async () => {
  const result = await $fetch('/api/getNews', {
    method: 'GET',
    params: {
      page: currentPage.value,
      limit: currentLimit.value
    }
  })
  newList.value = [...newList.value, ...result.result.results]
  total.value = result.total.results[0]['COUNT(*)']
}

const loadMoreTrigger = ref(null)

const isAlreadyLoading = ref(false)
const loadMoreNews = async () => {
  currentPage.value++
  if (currentPage.value * currentLimit.value >= total.value) {
    if (newList.value.length === 0) {
      console.log('页面刚刚初始化，新闻未加载')
    } else {
      alert('没有更多新闻了')
      observer.unobserve(loadMoreTrigger.value)
    }
    return
  }
  try {
    if (isAlreadyLoading.value) {
      return
    }
    isAlreadyLoading.value = true
    loadNews().then(() => {
      isAlreadyLoading.value = false
    })
  } catch (error) {
    isAlreadyLoading.value = false
    console.error('加载新闻失败:', error)
  }
}
let observer
onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
  window.addEventListener('resize', computeIframeHeight)
  window.addEventListener('keydown', handleKeydown)

  if (process.client) {
    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            loadMoreNews()
          }
        })
      },
      {
        rootMargin: '0px 0px 10000px 0px'
      }
    )
    if (observer && loadMoreTrigger.value) {
      observer.observe(loadMoreTrigger.value)
    }
  }
})

watchEffect(loadMoreTrigger, () => {
  if (observer && loadMoreTrigger.value) {
    observer.observe(loadMoreTrigger.value)
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', checkMobile)
  window.removeEventListener('resize', computeIframeHeight)
  window.removeEventListener('keydown', handleKeydown)

  if (observer && loadMoreTrigger.value) {
    observer.unobserve(loadMoreTrigger.value)
  }
})

const isMobile = ref(false)
const checkMobile = () => {
  isMobile.value = window.innerWidth < window.innerHeight * 0.8
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
  window.addEventListener('resize', computeIframeHeight)
  window.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', checkMobile)
  window.removeEventListener('resize', computeIframeHeight)
  window.removeEventListener('keydown', handleKeydown)
})

const iframeHeight = ref(300)

const computeIframeHeight = () => {
  const getNonZeroHeightElement = (selector) => {
    const elements = document.querySelectorAll(selector)
    for (const element of elements) {
      if (element.offsetHeight > 0) {
        return element
      }
    }
    return null
  }
  let containerHeight = (60 * window.innerHeight) / 100 // 容器高度为60vh
  if (focusMode.value) {
    containerHeight = (95 * window.innerHeight) / 100
  }
  const newsInfoDom = getNonZeroHeightElement('.news-info')
  const newsInfoHeight = newsInfoDom ? newsInfoDom.offsetHeight : 0
  const buttonContainerDom = getNonZeroHeightElement('.news-item > div:last-child')
  const buttonContainerHeight = buttonContainerDom ? buttonContainerDom.offsetHeight : 0
  iframeHeight.value =
    containerHeight - newsInfoHeight - buttonContainerHeight - 0.05 * window.innerHeight
}

watch(newList, () => {
  nextTick(() => {
    computeIframeHeight()
  })
})

// 统计最近的滚动速度，预测接下来5秒会不会滚动到底部
const scrollProbe = ref({
  lastScrollY: 0,
  lastScrollTime: Date.now(),
  isScrollingToBottom: false
})

const handleScroll = () => {
  const { lastScrollY, lastScrollTime } = scrollProbe.value
  const currentScrollY = window.scrollY
  const currentScrollTime = Date.now()
  const scrollDistance = currentScrollY - lastScrollY
  const scrollTime = currentScrollTime - lastScrollTime
  const scrollSpeed = scrollDistance / scrollTime
  const predictedScrollY = currentScrollY + scrollSpeed * 1000 // 预测5秒后的滚动位置
  const isScrollingToBottom =
    predictedScrollY >= document.documentElement.scrollHeight - window.innerHeight
  scrollProbe.value = {
    lastScrollY: currentScrollY,
    lastScrollTime: currentScrollTime,
    isScrollingToBottom
  }
}

watch(scrollProbe, (newVal) => {
  if (newVal.isScrollingToBottom && !isAlreadyLoading.value) {
    console.log('即将滚动到底部，加载更多新闻')
    loadMoreNews()
  }
})

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style scoped>
#news {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-around;
  align-items: center;
  margin: 20px auto;
}

#input {
  width: 80%;
  padding: 10px;
  margin: 10px;
  box-sizing: border-box;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 16px;
  transition:
    border-color 0.3s ease-in-out,
    box-shadow 0.3s ease-in-out;
}

#head,
#title,
#info {
  text-align: center;
  font-family: var(--vt-font-family-base);
  color: var(--vt-c-text-1);
  direction: ltr;
  -webkit-font-smoothing: antialiased;
  overflow-wrap: break-word;
  text-rendering: unset !important;
  font-synthesis: unset !important;
  box-sizing: border-box;
  line-height: 1.25;
  font-weight: 900;
}

#title,
#info {
  font-size: 64px;
  letter-spacing: -0.5px;
}

#title {
  text-size-adjust: 100%;
  --vt-font-family-base: Quotes, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
    Ubuntu, Cantarell, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
  text-rendering: unset !important;
  font-synthesis: unset !important;
  -webkit-text-fill-color: transparent;
  background: -webkit-linear-gradient(315deg, rgb(66, 211, 146) 25%, rgb(100, 126, 255)) text;
}

#info {
  max-width: 960px;
  margin: 0 auto;
}

#publish,
.btn {
  border-radius: 8px;
  box-sizing: border-box;
  cursor: pointer;
  direction: ltr;
  display: inline-block;
  font-family:
    Quotes,
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    Roboto,
    Oxygen,
    Ubuntu,
    Cantarell,
    'Fira Sans',
    'Droid Sans',
    'Helvetica Neue',
    sans-serif;
  font-size: 16px;
  font-synthesis:
    small-caps auto,
    style auto,
    weight auto;
  letter-spacing: 0.2px;
  line-height: 24px;
  overflow-wrap: break-word;
  padding: 8px 16px;
  text-align: center;
  text-decoration: none;
  text-rendering: auto;
  text-size-adjust: 100%;
  touch-action: manipulation;
  transition:
    background-color 0.2s ease,
    color 0.2s ease;
  -webkit-font-smoothing: antialiased;
}

#publish {
  background-color: rgb(66, 184, 131);
  color: rgb(255, 255, 255);
  font-weight: 600;
  margin-right: 18px;
  text-decoration-color: rgb(255, 255, 255);
}

.switch-focus {
  z-index: 9999;
  position: fixed;
  top: 40px;
  right: -100px;
  transform: translateY(-50%);
  padding: 10px 20px;
  background-color: #007bff;
  color: #fff;
  border: none;
  border-radius: 5px;
  transition: right 0.3s;
}

.switch-focus:hover {
  right: 0;
}
</style>
