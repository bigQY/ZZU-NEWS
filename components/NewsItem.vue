<template>
  <div ref="loadProbe" :class="{ 'focus-mode': isFocus }">
    <div :class="['news-item', { mobile: isMobile }]">
      <div class="news-info">
        <p :class="['publish-time', { mobile: isMobile }]">
          {{ new Date(news.publish_time).toLocaleString() }} 发布
        </p>
        <p :class="['read-count', { mobile: isMobile }]">浏览量 {{ news.read_count }}</p>
        <p :class="['like-count', { mobile: isMobile }]">点赞量 {{ news.like_count }}</p>
      </div>
      <div v-if="isShowIframe">
        <iframe
          v-show="!isLoading"
          :scrolling="iframeScrolling"
          class="news-iframe"
          :class="{ mobile: isMobile }"
          :src="news.url"
          @load="onIframeLoadWrapper($event)"
          :style="{ height: iframeHeight + 'px' }"
        ></iframe>
      </div>
      <div
        v-show="!isShowIframe || isLoading"
        class="loading-container"
        :style="{ height: iframeHeight + 'px' }"
      >
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
        <a class="btn" :href="news.url" @click.prevent="viewNews(news.url)">查看详情</a>
        <template v-if="isFocus">
          <a class="btn" @click="onPageChange('pre')">上一篇</a>
          <a class="btn" @click="onPageChange('next')">下一篇</a>
        </template>
        <a class="btn" @click="likeNews(news.url)">点赞</a>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onBeforeUnmount, onMounted } from 'vue'

const props = defineProps({
  news: Object,
  isMobile: Boolean,
  isFocus: {
    type: Boolean,
    default: false
  },
  iframeHeight: Number,
  onIframeLoad: {
    type: Function,
    default: () => {}
  },
  onPageChange: Function,
  iframeScrolling: {
    type: String,
    default: 'no'
  }
})

const isLoading = ref(true)
const isShowIframe = ref(false)

// 组件是否在视口中
const loadProbe = ref(null)

const viewChangeDelay = 100
let viewChangeTimer = null
const handleIntersection = (entries) => {
  entries.forEach((entry) => {
    if (viewChangeTimer) {
      clearTimeout(viewChangeTimer)
      viewChangeTimer = null
    }
    if (entry.isIntersecting) {
      viewChangeTimer = setTimeout(() => {
        isShowIframe.value = true
      }, viewChangeDelay)
    } else {
      viewChangeTimer = setTimeout(() => {
        isShowIframe.value = false
      }, viewChangeDelay)
    }
  })
}
let observer
onMounted(() => {
  if (import.meta.client) {
    observer = new IntersectionObserver(handleIntersection)
    observer.observe(loadProbe.value)
  }
})
onBeforeUnmount(() => {
  if (import.meta.client && observer) {
    observer.unobserve(loadProbe.value)
  }
})

const onIframeLoadWrapper = (event) => {
  isLoading.value = false
  props.onIframeLoad(event)
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

  const newWindow = window.open(url, '_blank')
  if (!newWindow) {
    alert('请允许弹出窗口')
    return
  }

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
</script>

<style scoped>
.news-item {
  width: 40vw;
  height: 60vh;
  margin: 20px 0;
  padding: 10px;
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

.focus-mode {
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
}
.focus-mode .news-item {
  width: 95% !important;
  height: 95% !important;
}
</style>
