<template>
  <div>
    <div id="head">
      <h1 id="title">郑州大学大新闻</h1>
      <p id="info">一个<span style="color: red">自由</span>的新闻媒体</p>
      <div style="margin-top: 50px">
        <a id="publish" @click="publishNew">发布新闻</a>
        <a class="explorer" href="#news">查看新闻</a>
      </div>
    </div>
    <div id="submitNewNews" style="width: 100%; text-align: center" v-if="submitOpen">
      <input id="input" v-model="newNewsInput" type="text" placeholder="请输入新闻的IPFS地址" />
      <a class="explorer" @click="submitNewNews">提交</a>
    </div>
    <div id="news">
      <!-- 新闻显示 -->
      <div
        v-for="(news, index) in newList"
        :key="news.id"
        :class="['news-item', { mobile: isMobile }]"
      >
        <div class="news-info">
          <p :class="['publish-time', { mobile: isMobile }]">
            {{ new Date(news.publish_time).toLocaleString() }} 发布
          </p>
          <p :class="['read-count', { mobile: isMobile }]">浏览量 {{ news.read_count }}</p>
          <p :class="['like-count', { mobile: isMobile }]">点赞量 {{ news.like_count }}</p>
        </div>
        <iframe
          v-if="index <= loadedIndex && index < maxLoadedIndex"
          scrolling="no"
          class="news-iframe"
          :class="{ mobile: isMobile }"
          :src="news.url"
          @load="onIframeLoad($event)"
          :style="{ height: iframeHeight + 'px' }"
        ></iframe>
        <div v-else class="loading-container">
          <div class="loading-text">加载中...</div>
        </div>
        <br />
        <div
          style="
            display: flex;
            justify-content: space-around;
            align-items: center;
            position: relative;
            box-shadow: rgb(255 255 255 / 100%) 0px -20px 20px 20px;
          "
        >
          <a class="explorer" @click="viewNews(news.url)">查看详情</a>
          <a class="explorer" @click="likeNews(news.url)">点赞</a>
        </div>
      </div>
      <div style="width: 100%; text-align: center" v-if="newList.length === 0">
        <div class="loading-container">
          <div class="loading-text">加载中...</div>
        </div>
      </div>
    </div>
    <div style="width: 100%; text-align: center">
      <a class="explorer" @click="loadMoreNews(0, 10)">查看更多</a>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed, nextTick, watch } from 'vue'

const submitOpen = ref(false)

const publishNew = () => {
  const publishUrl =
    'https://ipfs.zzu.news/ipfs/QmeU8dV5rKG4y47MKo7og5wkcp2K6FdSodNefiowfRSH1R/#ipfs.zzu.news'

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

const getScale = (widthRatio, widthPx) => {
  // 获取屏幕的宽高
  const screenWidth = window.innerWidth
  // 计算缩放比例
  const width = (widthRatio * screenWidth) / widthPx
  return {
    transform: `scale(${width})`
  }
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
    'https://ipfs.zzu.news/ipfs/QmeU8dV5rKG4y47MKo7og5wkcp2K6FdSodNefiowfRSH1R/#ipfs.zzu.news'
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
  console.log(result)
  submitOpen.value = false
}

const newList = ref([])
const loadedIndex = ref(0)
const maxLoadedIndex = ref(3) // 最多同时允许3个iframe加载
const onIframeLoad = (event) => {
  const iframe = event.target
  try {
    const iframeDocument = iframe.contentDocument || iframe.contentWindow.document
    iframeDocument.body.style.overflow = 'hidden'
  } catch (error) {
    console.error('无法访问iframe的内容:', error)
  }
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
const currentLimit = ref(10)
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

const loadMoreNews = async () => {
  currentPage.value++
  if (currentPage.value * currentLimit.value >= total.value) {
    alert('没有更多新闻了')
    return
  }
  await loadNews()
}

const isMobile = ref(false)
const checkMobile = () => {
  isMobile.value = window.innerWidth < window.innerHeight * 0.8
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
  window.addEventListener('resize', computeIframeHeight)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', checkMobile)
  window.removeEventListener('resize', computeIframeHeight)
})

const viewNews = async (url) => {
  const viewedNews = JSON.parse(localStorage.getItem('viewedNews')) || []
  if (viewedNews.includes(url)) {
    return
  }

  const newWindow = window.open(url, '_blank')
  if (!newWindow) {
    alert('请允许弹出窗口')
    return
  }

  await $fetch('/api/viewNews', {
    method: 'POST',
    body: {
      url
    }
  })

  viewedNews.push(url)
  localStorage.setItem('viewedNews', JSON.stringify(viewedNews))
}

const likeNews = async (url) => {
  const likedNews = JSON.parse(localStorage.getItem('likedNews')) || []
  if (likedNews.includes(url)) {
    return
  }

  await $fetch('/api/likeNews', {
    method: 'POST',
    body: {
      url
    }
  })

  likedNews.push(url)
  localStorage.setItem('likedNews', JSON.stringify(likedNews))
}

const iframeHeight = ref(300)

const computeIframeHeight = () => {
  const containerHeight = (60 * window.innerHeight) / 100 // 容器高度为60vh
  const newsInfoDom = document.querySelector('.news-info')
  const newsInfoHeight = newsInfoDom ? newsInfoDom.offsetHeight : 0
  const buttonContainerDom = document.querySelector('.news-item > div:last-child')
  const buttonContainerHeight = buttonContainerDom ? buttonContainerDom.offsetHeight : 0
  iframeHeight.value =
    containerHeight - newsInfoHeight - buttonContainerHeight - 0.05 * window.innerHeight
}

watch(newList, () => {
  nextTick(() => {
    computeIframeHeight()
  })
})
</script>

<style scoped>
#news-iframe {
  width: 100%;
  height: 80%;
  border: none;
  margin: 0;
  padding: 0;
}
#news-iframe.mobile {
  height: 70%;
}

.loading-container {
  width: 100%;
  height: 40vh;
  display: flex;
  justify-content: center;
  align-items: center;
}

.loading-text {
  font-size: 24px;
  animation: loadingAnimation 1.5s infinite;
}

@keyframes loadingAnimation {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
  100% {
    opacity: 1;
  }
}

#news {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-around;
  align-items: center;
  margin: 20px auto;
}

.news-item {
  width: 40vw;
  height: 60vh;
  margin: 20px 0;
  text-align: center;
  overflow-x: hidden;
  padding-top: 10px;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  background-color: #fff;
  transition:
    transform 0.3s,
    box-shadow 0.3s;
}

.news-item.mobile {
  width: 80vw;
}

.news-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
}

.news-info {
  display: flex;
  justify-content: space-around;
  flex-flow: wrap;
  align-items: center;
  margin-bottom: 10px;
}

.publish-time {
  background-color: #e0f7fa;
  color: #00796b;
}
.publish-time.mobile {
  width: 98%;
  margin: 5px 2%;
  flex-grow: 1;
}
.read-count {
  background-color: #fff3e0;
  color: #e65100;
}
.read-count.mobile {
  width: 40%;
  margin: 5px 2%;
}

.like-count {
  background-color: #fce4ec;
  color: #d81b60;
}
.like-count.mobile {
  width: 40%;
  margin: 5px 2%;
}

.news-info p {
  margin: 5px 0;
  padding: 5px 10px;
  border-radius: 5px;
  background-color: #f5f5f5;
  /* color: #333; */
  font-size: 14px;
}

.news-iframe {
  width: 100%;
  height: 100%;
  border: none;
  margin: 0;
  padding: 0;
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
#head {
  text-align: center;
  padding: 10px;
}
#title {
  text-size-adjust: 100%;
  font-family: var(--vt-font-family-base);
  color: var(--vt-c-text-1);
  direction: ltr;
  -webkit-font-smoothing: antialiased;
  overflow-wrap: break-word;
  --vt-font-family-base: Quotes, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
    Ubuntu, Cantarell, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
  text-rendering: unset !important;
  font-synthesis: unset !important;
  text-align: center;
  line-height: 1.25;
  font-weight: 900;
  font-size: 64px;
  letter-spacing: -0.5px;
  box-sizing: border-box;
  -webkit-text-fill-color: transparent;
  background: -webkit-linear-gradient(315deg, rgb(66, 211, 146) 25%, rgb(100, 126, 255)) text;
}
#publish {
  background-color: rgb(66, 184, 131);
  border-bottom-left-radius: 8px;
  border-bottom-right-radius: 8px;
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
  box-sizing: border-box;
  color: rgb(255, 255, 255);
  cursor: pointer;
  direction: ltr;
  display: inline-block;
  font-size: 16px;
  font-synthesis-small-caps: auto;
  font-synthesis-style: auto;
  font-synthesis-weight: auto;
  font-weight: 600;
  letter-spacing: 0.2px;
  line-height: 24px;
  margin-right: 18px;
  overflow-wrap: break-word;
  padding-bottom: 8px;
  padding-left: 16px;
  padding-right: 16px;
  padding-top: 8px;
  position: relative;
  text-align: center;
  text-decoration-color: rgb(255, 255, 255);
  text-decoration-line: none;
  text-decoration-style: solid;
  text-decoration-thickness: auto;
  text-rendering: auto;
  text-size-adjust: 100%;
  touch-action: manipulation;
}
.explorer {
  background-attachment: scroll, scroll;
  background-clip: padding-box, border-box;
  background-color: rgba(229, 229, 229, 0.082);
  background-image: linear-gradient(rgb(229, 229, 229), rgb(229, 229, 229)),
    linear-gradient(45deg, rgb(66, 211, 146), rgb(100, 126, 255));
  background-origin: padding-box, border-box;
  background-position-x: 0%, 0%;
  background-position-y: 0%, 0%;
  background-repeat: repeat, repeat;
  background-size: auto, auto;
  border-bottom-color: rgba(0, 0, 0, 0);
  border-bottom-left-radius: 8px;
  border-bottom-right-radius: 8px;
  border-bottom-style: solid;
  border-bottom-width: 1.8018px;
  border-image-outset: 0;
  border-image-repeat: stretch;
  border-image-slice: 100%;
  border-image-source: none;
  border-image-width: 1;
  border-left-color: rgba(0, 0, 0, 0);
  border-left-style: solid;
  border-left-width: 1.8018px;
  border-right-color: rgba(0, 0, 0, 0);
  border-right-style: solid;
  border-right-width: 1.8018px;
  border-top-color: rgba(0, 0, 0, 0);
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
  border-top-style: solid;
  border-top-width: 1.8018px;
  box-sizing: border-box;
  color: rgb(71, 101, 130);
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
  font-weight: 500;
  letter-spacing: 0.2px;
  line-height: 24px;
  overflow-wrap: break-word;
  padding-bottom: 8px;
  padding-left: 18px;
  padding-right: 18px;
  padding-top: 8px;
  text-align: center;
  text-decoration-color: rgb(71, 101, 130);
  text-decoration-line: none;
  text-decoration-style: solid;
  text-decoration-thickness: auto;
  text-rendering: auto;
  text-size-adjust: 100%;
  touch-action: manipulation;
  transition-behavior: normal, normal;
  transition-delay: 0s, 0s;
  transition-duration: 0.2s;
  transition-property: background-color, color;
  transition-timing-function: ease, ease;
  -webkit-font-smoothing: antialiased;
  -webkit-border-image: none;
}
#info {
  text-size-adjust: 100%;
  font-family: var(--vt-font-family-base);
  color: var(--vt-c-text-1);
  direction: ltr;
  -webkit-font-smoothing: antialiased;
  overflow-wrap: break-word;
  text-rendering: unset !important;
  font-synthesis: unset !important;
  text-align: center;
  box-sizing: border-box;
  line-height: 1.25;
  font-weight: 900;
  max-width: 960px;
  margin: 0px auto;
  font-size: 64px;
  letter-spacing: -0.5px;
}
</style>
