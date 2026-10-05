import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // 개발 중 /api 요청은 내장 서버(npm run server)로 전달
    proxy: { '/api': 'http://localhost:8787' },
  },
})
