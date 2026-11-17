import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // مسارات نسبية ليعمل البناء على النطاق الأصلي وعلى GitHub Pages في مسار فرعي
  base: './',
  plugins: [react()],
  build: {
    target: 'es2022',
  },
})
