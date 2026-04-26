import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// ❌ REMOVED: import basicSsl from '@vitejs/plugin-basic-ssl'

export default defineConfig({
  plugins: [
    react(),
    // ❌ REMOVED: basicSsl() 
  ],
  server: {
    host: true // ✅ KEEP THIS: It allows your phone to connect via your IP address
  }
})