import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // On Vercel, a build without VITE_API_URL would ship an app that calls http://localhost:4000.
  // Fail the deploy instead, with the fix in the message.
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  if (process.env.VERCEL && mode === 'production' && !env.VITE_API_URL) {
    throw new Error('VITE_API_URL is not set. Add it in Vercel > Project > Settings > Environment Variables, e.g. https://medios-api.onrender.com/api')
  }
  return { plugins: [react()] }
})
