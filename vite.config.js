import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
//import basicSsl from '@vitejs/plugin-basic-ssl'

export default defineConfig({
  plugins: [
   // basicSsl(),
    react(), 
  ],
  server: {
    host: true,  // ✅ Exposes your server to 192.168.25.190
    port: 5173,  // ✅ Keeps you on port 5173
    
    // ✅ The Proxy to fix CORS
    proxy: {
      '/api': {
        target: 'https://coop-sustain-be.climbs.coop',
        changeOrigin: true, // Tricks the backend into thinking the request came from its own domain
        secure: false,      // Important: Helps prevent SSL errors when proxying from HTTP to HTTPS
      },
    },
  }
})