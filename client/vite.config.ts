import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
   plugins: [react()],
   server:{
      /*
      https: {
         key: './certificates/localhost-key.pem',
         cert: './certificates/localhost.pem'
      }
      */
   }
})
