import { defineConfig, loadEnv  } from 'vite'
import react from '@vitejs/plugin-react'
import process from 'process'

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const endPoint = env.VITE_TARGET_END_POINT;
  return {
    plugins: [react()],
    server: {
      port: 3000,
      // Get rid of the cors error
      proxy: {
        '/api': {
          target: endPoint,
          changeOrigin: true,
          secure: false,
        }
      }
    },
    define: {
      'process.env': {
        'import.meta.env.VITE_SOCKET_IO_ENDPOINT': JSON.stringify(env.VITE_SOCKET_IO_ENDPOINT)
      },
    },
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: './tests/setup.js',
    }
  }
})
