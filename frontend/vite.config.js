import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const backendUrl = process.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000';

  return {
    plugins: [react()],
    server: {
      port: 5173,
      host: true,
      proxy: {
        '/api': {
          target: backendUrl,
          changeOrigin: true,
          secure: false,
        },
        '/media': {
          target: backendUrl,
          changeOrigin: true,
          secure: false,
        }
      }
    }
  };
});
