import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin({exclude:['hyparquet','hyparquet-compressors']})],
    build: {
      rollupOptions: {
        input: path.resolve(__dirname, 'desktop/main.ts')
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        input: path.resolve(__dirname, 'desktop/preload.ts')
      }
    }
  },
  renderer: {
    root: path.resolve(__dirname, 'frontend'),
    plugins: [react()],
    build: {
      rollupOptions: {
        input: path.resolve(__dirname, 'frontend/index.html')
      }
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'frontend/src')
      }
    }
  }
})
