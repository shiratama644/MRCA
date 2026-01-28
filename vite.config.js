import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
  ],
  // ★ここを追加★
  server: {
    watch: {
      usePolling: true, // ポーリングモードを有効化
    }
  }
})