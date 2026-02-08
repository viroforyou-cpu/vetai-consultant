import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

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
    define: {
      'process.env': {
        ...env,
        AI_MODEL: aiModel
      }
    },
    server: {
      port: 3000,
      host: true,
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