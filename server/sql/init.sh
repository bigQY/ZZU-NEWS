#local
wrangler d1 execute ZZU_NEWS_DATABASE --local --file server/sql/init.sql
wrangler dev --local --persist

#server
wrangler d1 execute ZZU_NEWS_DATABASE --remote --file server/sql/init.sql
wrangler deploy