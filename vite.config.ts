import { defineConfig, loadEnv } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  if (mode === 'production') {
    const apiBaseUrl = env.VITE_API_BASE_URL?.trim()
    if (!apiBaseUrl) {
      throw new Error('Production builds require VITE_API_BASE_URL to be set in the deployment environment.')
    }
    if (!apiBaseUrl.startsWith('/')) {
      let apiUrl: URL
      try {
        apiUrl = new URL(apiBaseUrl)
      } catch {
        throw new Error('VITE_API_BASE_URL must be an HTTPS URL or a same-origin path such as /api.')
      }
      if (apiUrl.protocol !== 'https:' || apiUrl.username || apiUrl.password || ['localhost', '127.0.0.1', '[::1]'].includes(apiUrl.hostname)) {
        throw new Error('Production VITE_API_BASE_URL must use HTTPS and must not contain credentials or a localhost host.')
      }
    } else if (apiBaseUrl.startsWith('//')) {
      throw new Error('Production VITE_API_BASE_URL must be a same-origin path, not a protocol-relative URL.')
    }
  }

  return {
    plugins: [
      react(),
      babel({ presets: [reactCompilerPreset()] })
    ],
  }
})
