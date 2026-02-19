import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');
  // Default to localhost for local dev, or use env var (e.g. from Docker)
  // Ensure we check process.env first as Docker Compose vars land there directly in Node context
  const backendUrl = process.env.VITE_BACKEND_URL || env.VITE_BACKEND_URL || 'http://127.0.0.1:8000';

  // Log current AI model
  const aiModel = process.env.AI_MODEL || env.AI_MODEL || 'gemini';
  console.log(`[Vite] Proxying /api to: ${backendUrl}`);
  console.log(`[Vite] AI Model: ${aiModel}`);

  return {
    plugins: [react()],
    base: './',  // Use relative paths for Vercel compatibility
    define: {
      'process.env': {
        ...env,
        AI_MODEL: aiModel
      }
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom'],
            'd3': ['d3'],
          }
        }
      }
    },
    server: {
      port: 3000,
      host: true,
      strictPort: true,
      hmr: {
        protocol: 'ws',
        host: 'localhost'
      },
      proxy: {
        '/api': {
          target: backendUrl,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api/, '')
        }
      }
    }
  }
})
