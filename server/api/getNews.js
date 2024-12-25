export default defineEventHandler(async (event) => {
  const ZZU_NEWS_DATABASE = event.context.cloudflare.env.ZZU_NEWS_DATABASE
  const data = getQuery(event)
  const page = data.page
  const limit = data.limit
  // 按照id降序查询
  const result = await ZZU_NEWS_DATABASE.prepare(
    `SELECT * FROM news ORDER BY id DESC LIMIT ? OFFSET ?`
  )
    .bind(limit, (page - 1) * limit)
    .all()
  const total = await ZZU_NEWS_DATABASE.prepare('SELECT COUNT(*) FROM news').run()

  return { result, total }
})
