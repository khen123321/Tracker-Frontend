import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
 // import basicSsl from '@vitejs/plugin-basic-ssl' // ✨ ADDED THIS IMPORT

export default defineConfig({
  plugins: [
    react(), // ✅ This must stay active!
    // basicSsl() // ✨ ADDED THIS PLUGIN TO ENABLE HTTPS
  ],
  server: {
   //host: true,   // ✅ Allows other devices on your Wi-Fi to connect
    port: 5173    
  }
})