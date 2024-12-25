export default defineEventHandler(async (event) => {
  const ZZU_NEWS_DATABASE = event.context.cloudflare.env.ZZU_NEWS_DATABASE
  const data = getQuery(event)
  const publish_time = new Date().toISOString()
  // 插入一条数据到news表
  const result = await ZZU_NEWS_DATABASE.prepare(
    'INSERT INTO news (url, publish_time) VALUES (?, ?)'
  )
    .bind(data.url, publish_time)
    .run()
  return result
})
