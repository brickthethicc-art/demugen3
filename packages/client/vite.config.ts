import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

export default defineConfig(({ mode }) => {
  const envRoot = resolve(process.cwd(), '../../');
  const env = loadEnv(mode, envRoot, '');
  const devPort = Number(env['VITE_DEV_PORT'] || 5173);
  const defaultBackendPort = mode === 'localdev' ? 6173 : 5174;
  const backendPort = Number(env['VITE_BACKEND_PORT'] || defaultBackendPort);

  return {
    plugins: [react()],
    envDir: '../../',
    server: {
      port: devPort,
      host: '0.0.0.0',
      strictPort: true,
      allowedHosts: true,
      proxy: {
        '/socket.io': {
          target: `http://localhost:${backendPort}`,
          changeOrigin: true,
          ws: true,
        },
        '/health': {
          target: `http://localhost:${backendPort}`,
          changeOrigin: true,
        },
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            phaser: ['phaser'],
          },
        },
      },
    },
  };
});
