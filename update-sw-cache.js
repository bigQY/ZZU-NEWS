import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// 获取当前文件的目录名
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 生成新的 CACHE_NAME
const newCacheName = `v${Date.now()}`

// 读取 service-worker.js 文件
const swFilePath = path.join(__dirname, 'dist', 'service-worker.js')
let swFileContent = fs.readFileSync(swFilePath, 'utf8')

// 更新 CACHE_NAME
swFileContent = swFileContent.replace(
  `const CACHE_NAME = 'CACHE_NAME_PLACEHOLDER'`,
  `const CACHE_NAME = '${newCacheName}';`
)

// 写回 service-worker.js 文件
fs.writeFileSync(swFilePath, swFileContent, 'utf8')

console.log(`Updated service-worker.js with new CACHE_NAME: ${newCacheName}`)
