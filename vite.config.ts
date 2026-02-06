import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const backendPort = env.PORT || '7482'

  return {
    plugins: [vue()],
    server: {
      proxy: {
        // 代理后端 API 请求（端口与 .env 的 PORT 保持一致）
        '/api': {
          target: `http://localhost:${backendPort}`,
          changeOrigin: true
        }
      }
    }
  }
})
