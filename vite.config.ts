import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/tainacan': {
        target: 'https://tainacan.ufsm.br',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/tainacan/, '/acervo-artistico/wp-json/tainacan/v2')
      }
    }
  }
})
