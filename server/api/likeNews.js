// 点击一篇新闻，增加阅读量
export default defineEventHandler(async (event) => {
  const ZZU_NEWS_DATABASE = event.context.cloudflare.env.ZZU_NEWS_DATABASE
  const body = await readBody(event)
  const url = body.url
  // 按照id降序查询
  const result = await ZZU_NEWS_DATABASE.prepare(
    `UPDATE news SET like_count = like_count + 1 WHERE url = ?`
  )
    .bind(url)
    .run()
  return { result }
})
