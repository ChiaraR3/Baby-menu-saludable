// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  modules: [
    '@vite-pwa/nuxt',
    // '@nuxtjs/tailwindcss' // Si decides usar Tailwind
  ],

  pwa: {
    registerType: 'autoUpdate', // O 'prompt' para que el usuario decida actualizar
    manifest: {
      name: 'Menú Ghibli Bebé',
      short_name: 'MenúBebé',
      description: 'Planificador de cenas infantiles inspirado en Ghibli.',
      theme_color: '#B2D8B4', // Un color de tu paleta Ghibli (ej. --ghibli-green-light)
      background_color: '#a9d9ef', // Un color de fondo (ej. --ghibli-blue-sky)
      display: 'standalone', // o 'fullscreen' o 'minimal-ui'
      start_url: '/', // URL de inicio de tu app
      icons: [
        {
          src: '/icons/icon-72x72.png', // Necesitarás crear estos iconos
          sizes: '72x72',
          type: 'image/png',
        },
        {
          src: '/icons/icon-96x96.png',
          sizes: '96x96',
          type: 'image/png',
        },
        {
          src: '/icons/icon-128x128.png',
          sizes: '128x128',
          type: 'image/png',
        },
        {
          src: '/icons/icon-144x144.png',
          sizes: '144x144',
          type: 'image/png',
        },
        {
          src: '/icons/icon-152x152.png',
          sizes: '152x152',
          type: 'image/png',
        },
        {
          src: '/icons/icon-192x192.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'maskable', // Importante para iconos adaptables
        },
        {
          src: '/icons/icon-384x384.png',
          sizes: '384x384',
          type: 'image/png',
        },
        {
          src: '/icons/icon-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any maskable', // Maskable para mejor apariencia en Android
        },
      ],
    },
    workbox: {
      globPatterns: ['**/*.{js,css,html,png,svg,ico}'], // Archivos a cachear
      // Opcional: runtimeCaching para la API de Gemini (si quieres intentar cachear respuestas, aunque podría no ser ideal)
      // runtimeCaching: [
      //   {
      //     urlPattern: ({ url }) => url.pathname.startsWith('/api/generate-meals'),
      //     handler: 'NetworkFirst', // Intenta red, luego caché. O 'CacheFirst' si las respuestas son muy estables.
      //     options: {
      //       cacheName: 'gemini-api-cache',
      //       expiration: {
      //         maxEntries: 10,
      //         maxAgeSeconds: 60 * 60 * 24 // 1 día
      //       }
      //     }
      //   }
      // ]
    },
    devOptions: {
      enabled: true, // Habilitar PWA en desarrollo para probar
      type: 'module',
    },
  },

  // Opcional: si usas SSR (render: 'server') y quieres que el service worker se registre bien
  // routeRules: {
  //   '/**': { ssr: true }, // O ajusta según tus necesidades
  // },
})
