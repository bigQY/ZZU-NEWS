-- 删除已有的新闻表
DROP TABLE IF EXISTS news;

-- 创建一个新闻表，包含id、内容url、发布时间、阅读量、点赞量
-- 禁止url重复，发布时间不能为空，阅读量和点赞量默认为0
CREATE TABLE news (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    url TEXT NOT NULL UNIQUE,
    publish_time DATETIME NOT NULL,
    read_count INTEGER NOT NULL DEFAULT 0,
    like_count INTEGER NOT NULL DEFAULT 0
);
