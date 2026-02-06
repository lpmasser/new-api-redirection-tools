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
      }
    }
  }
})
