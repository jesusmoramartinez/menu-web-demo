/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      // La cocina/mozo pueden quedar con la pestaña abierta días enteros: conviene
      // que tome la versión nueva sola en vez de esperar a que alguien recargue.
      injectRegister: 'auto',
      includeAssets: ['favicon-32.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'Menú Digital',
        short_name: 'Menú Digital',
        description: 'Menú QR y comandas en tiempo real para restaurantes',
        lang: 'es',
        theme_color: '#1c1917',
        background_color: '#f5f5f4',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Sólo cachea el shell de la app (JS/CSS/HTML/íconos); nunca las llamadas a
        // Supabase (distinto origen, no matchean estos patrones) — los datos de
        // pedidos/mesas siempre se piden a la red, nunca se sirven "viejos".
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
        // Todas las rutas son manejadas por react-router client-side (incluida /r/:slug/m/:token,
        // el link del QR): con wifi débil en el salón, el shell cacheado igual carga y la app
        // valida el token contra la red una vez montada.
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true,
      },
      devOptions: { enabled: false },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    env: { VITE_SUPABASE_URL: 'http://localhost:54321', VITE_SUPABASE_ANON_KEY: 'test-anon-key' },
    css: false,
  },
})
