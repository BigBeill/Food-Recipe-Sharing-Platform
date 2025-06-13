import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
   plugins: [react()],
   server:{
      proxy: {
         "/proxy": {
            // VITE DEV SERVER ONLY - This proxy is ignored in production
            target: "http://localhost:4000",
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/proxy/, ""),
            configure: (proxy) => {
               proxy.on('proxyReq', (proxyReq, req) => {
                  if (!req.headers.origin) { proxyReq.setHeader('Origin', 'http://localhost:5173'); }
               });
            }
         }
      }
   }
})
