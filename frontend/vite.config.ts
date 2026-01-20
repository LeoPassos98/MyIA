// frontend/vite.config.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        timeout: 60000,
        proxyTimeout: 60000,
      },
    },
  },
  optimizeDeps: {
    include: [
      '@mui/material',
      '@mui/icons-material',
    ],
  },
  build: {
    // ✅ OTIMIZAÇÃO FASE 4: Bundle Size Optimization
    // Target: 50-60% redução no bundle inicial
    
    // Aumentar limite de warning para chunks grandes
    chunkSizeWarningLimit: 1000,
    
    // Minificação com esbuild (mais rápido que terser)
    minify: 'esbuild',
    
    rollupOptions: {
      output: {
        // ✅ Code Splitting: Separar vendors e features em chunks
        manualChunks: {
          // Core vendors (carregados sempre)
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          
          // UI Library (MUI)
          'mui-core': ['@mui/material', '@mui/system', '@emotion/react', '@emotion/styled'],
          'mui-icons': ['@mui/icons-material'],
          
          // Charts (usado apenas em analytics)
          'recharts': ['recharts'],
          
          // Markdown (usado apenas em mensagens)
          'markdown': ['react-markdown', 'remark-gfm'],
          
          // Utilities
          'utils': [
            'axios',
            'date-fns',
          ],
        },
        
        // ✅ Naming pattern para chunks
        chunkFileNames: () => {
          return `assets/js/[name]-[hash].js`;
        },
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },
    
    // ✅ Source maps apenas em dev
    sourcemap: false,
    
    // ✅ CSS Code Splitting
    cssCodeSplit: true,
    
    // ✅ Otimizar assets
    assetsInlineLimit: 4096, // Inline assets < 4kb
  },
})
