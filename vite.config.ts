import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), ''); // '' zaroori hai

  console.log('DLE_URL =', env.DLE_URL, '| KEY set =', !!env.DLE_API_KEY); // debug

  const dleProxy = {
    target: env.DLE_URL,
    changeOrigin: true,
    secure: true,
    headers: {
      'X-Portal-Api-Key': env.DLE_API_KEY,
      'X-Portal-Api-Secret': env.DLE_API_SECRET,
    },
  };

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api/attendance': dleProxy,
        '/api/light-amc': dleProxy,
        '/api/bihar': dleProxy,
        '/api/up': dleProxy,
        '/api/portal': dleProxy,
        '/api/admin': dleProxy,
        '/api/admin/approval/status' : dleProxy,
        '/uploads': dleProxy, // UP AMC images: /uploads/light-amc/xxx.jpg  (<img> header nahi bhej sakta, isliye proxy key lagata hai)
      },
    },
    build: {
      target: 'es2020',
      cssCodeSplit: true,
      chunkSizeWarningLimit: 1200,
      rollupOptions: {
        output: {
          manualChunks(id) {
            const normalized = id.replace(/\\/g, '/');
            if (normalized.includes('node_modules')) {
              if (normalized.includes('apexcharts')) return 'vendor-apexcharts';
              if (normalized.includes('leaflet') || normalized.includes('react-leaflet') || normalized.includes('react-simple-maps')) {
                return 'vendor-maps';
              }
              if (normalized.includes('react-router-dom') || normalized.includes('react-router')) {
                return 'vendor-router';
              }
              if (normalized.includes('react') || normalized.includes('react-dom') || normalized.includes('scheduler')) {
                return 'vendor-react';
              }
              return 'vendor-core';
            }
            // Code splitting for DLE features
            if (normalized.includes('/src/components/DLE/Bihar/AMC/')) return 'chunk-dle-bihar-amc';
            if (normalized.includes('/src/components/DLE/Bihar/Installation/')) return 'chunk-dle-bihar-ula';
            if (normalized.includes('/src/components/DLE/UP/AMC/')) return 'chunk-dle-up-amc';
            if (normalized.includes('/src/components/DLE/Management/')) return 'chunk-dle-management';
            if (normalized.includes('/src/components/DLE/DLEDashboard')) return 'chunk-dle-dashboard';
          },
        },
      },
    },
  };
});