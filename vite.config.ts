import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      // 代理后端 API 请求
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      },
      // 代理所有 /proxy 开头的请求
      '/proxy': {
        target: 'https://api.eloyzh.de',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/proxy/, ''),
        secure: false
      }
    }
  }
})
