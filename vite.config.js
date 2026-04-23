import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl' // 👈 1. Import the new plugin

export default defineConfig({
  plugins: [
    react(),
    basicSsl() // 👈 2. Add it to your plugins array
  ],
  server: {
    host: true // 👈 3. This allows your phone to connect to your PC
  }
})