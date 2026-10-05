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
        '/api/bihar': dleProxy,
        '/api/up': dleProxy,
        '/api/portal': dleProxy,
        '/api/admin': dleProxy,
        '/api/admin/approval/status' : dleProxy,
        '/uploads': dleProxy, // UP AMC images: /uploads/light-amc/xxx.jpg  (<img> header nahi bhej sakta, isliye proxy key lagata hai)
      },
    },
  };
});