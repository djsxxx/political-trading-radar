// 网页版构建（GitHub Pages 等静态托管）：只构建前端，不含 Electron 主进程。
// base 设为相对路径，部署在任意子路径下都能找到资源与 JSON 数据。
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  root: path.resolve(__dirname, 'frontend'),
  base: './',
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(__dirname, 'frontend/src') } },
  build: { outDir: path.resolve(__dirname, 'dist-web'), emptyOutDir: true },
})
