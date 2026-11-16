import { defineConfig, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

/**
 * 分享預覽圖（og:image）必須是含網域的完整網址，LINE、Facebook 才讀得到。
 * 網域依序取用：
 * 1. 環境變數 SITE_URL（例如 https://www.example.com），有自訂網域時可在 Vercel 設定
 * 2. Vercel 自動提供的正式網域 VERCEL_PROJECT_PRODUCTION_URL
 * 都沒有時（例如本機開發）維持相對路徑。
 */
function absoluteShareImage(): Plugin {
  const raw =
    process.env.SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : '')
  const origin = raw.replace(/\/+$/, '')
  return {
    name: 'absolute-share-image',
    transformIndexHtml(html) {
      if (!origin) return html
      return html.replace(/(<meta property="og:image" content=")\/(?!\/)/, `$1${origin}/`)
    },
  }
}

export default defineConfig({
  plugins: [vue(), absoluteShareImage()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
})
